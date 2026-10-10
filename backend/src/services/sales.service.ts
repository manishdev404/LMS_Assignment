import type { Document, ObjectId } from 'mongodb';
import { LEAD_STAGES, type LeadStage } from '../constants/lead';
import { ROLES } from '../constants/roles';
import { COLLECTIONS, collections } from '../db/collections';
import type { BorrowerProfileDocument } from '../interfaces/borrower.interface';
import type { LeadDto, LeadsPageDto, LeadsQuery } from '../interfaces/dashboard.interface';
import { buildPagination } from '../utils/api-response';
import { escapeRegex } from '../utils/mongo';

interface LeadRow {
  _id: ObjectId;
  name: string;
  email: string;
  createdAt: Date;
  stage: LeadStage;
  profile: BorrowerProfileDocument | null;
}

interface LeadsFacet {
  items: LeadRow[];
  total: Array<{ count: number }>;
  stageCounts: Array<{ _id: LeadStage; count: number }>;
}

/** Borrowers who registered but have never applied for a loan. */
function leadsBasePipeline(): Document[] {
  return [
    { $match: { role: ROLES.BORROWER } },
    {
      $lookup: {
        from: COLLECTIONS.LOANS,
        localField: '_id',
        foreignField: 'borrowerId',
        as: 'loans',
        pipeline: [{ $limit: 1 }, { $project: { _id: 1 } }],
      },
    },
    { $match: { loans: { $size: 0 } } },
  ];
}

/** Funnel stage is derived from real data, so it can never drift out of sync. */
const STAGE_EXPRESSION = {
  $switch: {
    branches: [
      { case: { $eq: ['$profile', null] }, then: 'REGISTERED' },
      { case: { $ne: ['$profile.bre.eligible', true] }, then: 'BRE_REJECTED' },
      { case: { $eq: [{ $ifNull: ['$profile.salarySlip', null] }, null] }, then: 'DETAILS_SUBMITTED' },
    ],
    default: 'DOCUMENT_UPLOADED',
  },
};

function toLeadDto(row: LeadRow): LeadDto {
  const { profile } = row;
  return {
    userId: row._id.toHexString(),
    name: row.name,
    email: row.email,
    registeredAt: row.createdAt.toISOString(),
    stage: row.stage,
    profile: profile
      ? {
          fullName: profile.fullName,
          pan: profile.pan,
          monthlySalary: profile.monthlySalary,
          employmentMode: profile.employmentMode,
          age: profile.bre.age,
          eligible: profile.bre.eligible,
          breFailures: profile.bre.failures,
          salarySlipUploaded: profile.salarySlip !== null,
          updatedAt: profile.updatedAt.toISOString(),
        }
      : null,
  };
}

export async function listLeads(query: LeadsQuery): Promise<LeadsPageDto> {
  const searchStage: Document[] = query.search
    ? (() => {
        const pattern = new RegExp(escapeRegex(query.search), 'i');
        return [
          {
            $match: {
              $or: [{ name: pattern }, { email: pattern }, { 'profile.pan': pattern }, { 'profile.fullName': pattern }],
            },
          },
        ];
      })()
    : [];
  const stageFilter: Document[] = query.stage ? [{ $match: { stage: query.stage } }] : [];

  const [result] = await collections
    .users()
    .aggregate<LeadsFacet>([
      ...leadsBasePipeline(),
      {
        $lookup: {
          from: COLLECTIONS.BORROWER_PROFILES,
          localField: '_id',
          foreignField: 'userId',
          as: 'profile',
        },
      },
      { $set: { profile: { $ifNull: [{ $first: '$profile' }, null] } } },
      ...searchStage,
      { $set: { stage: STAGE_EXPRESSION } },
      {
        $facet: {
          stageCounts: [{ $group: { _id: '$stage', count: { $sum: 1 } } }],
          total: [...stageFilter, { $count: 'count' }],
          items: [
            ...stageFilter,
            { $sort: { createdAt: -1 } },
            { $skip: (query.page - 1) * query.limit },
            { $limit: query.limit },
            { $project: { name: 1, email: 1, createdAt: 1, stage: 1, profile: 1 } },
          ],
        },
      },
    ])
    .toArray();

  const stageCounts = Object.fromEntries(LEAD_STAGES.map((stage) => [stage, 0])) as Record<LeadStage, number>;
  for (const { _id, count } of result?.stageCounts ?? []) {
    stageCounts[_id] = count;
  }

  return {
    items: (result?.items ?? []).map(toLeadDto),
    pagination: buildPagination(query.page, query.limit, result?.total[0]?.count ?? 0),
    stageCounts,
  };
}

export async function countLeads(): Promise<number> {
  const [result] = await collections
    .users()
    .aggregate<{ count: number }>([...leadsBasePipeline(), { $count: 'count' }])
    .toArray();
  return result?.count ?? 0;
}
