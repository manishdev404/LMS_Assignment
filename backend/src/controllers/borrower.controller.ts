import type { Request, Response } from 'express';
import type { PersonalDetailsInput } from '../interfaces/borrower.interface';
import type { LoanIdParams } from '../interfaces/http.interface';
import type { ApplyLoanInput } from '../interfaces/loan.interface';
import { requireUser } from '../middlewares/auth.middleware';
import { validatedHandler } from '../middlewares/validate.middleware';
import * as profileService from '../services/borrower-profile.service';
import * as applicationService from '../services/loan-application.service';
import { sendSuccess } from '../utils/api-response';
import { streamFile } from '../utils/file-response';
import { toObjectId } from '../utils/mongo';

export async function getApplication(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await applicationService.getApplicationState(requireUser(req).id));
}

export const savePersonalDetails = validatedHandler<{ body: PersonalDetailsInput }>(async (req, res) => {
  const profile = await profileService.savePersonalDetails(requireUser(req), req.body);
  sendSuccess(res, { profile });
});

export async function uploadSalarySlip(req: Request, res: Response): Promise<void> {
  const upload = req.file
    ? {
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        declaredMimeType: req.file.mimetype,
        size: req.file.size,
      }
    : null;
  const salarySlip = await profileService.uploadSalarySlip(requireUser(req), upload);
  sendSuccess(res, { salarySlip }, 201);
}

export async function downloadSalarySlip(req: Request, res: Response): Promise<void> {
  await streamFile(res, await profileService.openOwnSalarySlip(requireUser(req).id));
}

export const applyForLoan = validatedHandler<{ body: ApplyLoanInput }>(async (req, res) => {
  const loan = await applicationService.applyForLoan(requireUser(req), req.body);
  sendSuccess(res, { loan }, 201);
});

export async function listLoans(req: Request, res: Response): Promise<void> {
  const loans = await applicationService.listBorrowerLoans(requireUser(req).id);
  sendSuccess(res, { items: loans });
}

export const getLoan = validatedHandler<{ params: LoanIdParams }>(async (req, res) => {
  const result = await applicationService.getBorrowerLoan(requireUser(req).id, toObjectId(req.params.loanId));
  sendSuccess(res, result);
});
