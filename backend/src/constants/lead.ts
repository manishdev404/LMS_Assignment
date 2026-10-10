/** Pre-application funnel stages shown to the Sales team (derived, never stored). */
export const LEAD_STAGES = [
  'REGISTERED',
  'BRE_REJECTED',
  'DETAILS_SUBMITTED',
  'DOCUMENT_UPLOADED',
] as const;

export type LeadStage = (typeof LEAD_STAGES)[number];
