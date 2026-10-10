import type { Request, Response } from 'express';
import { isDatabaseHealthy } from '../db/client';
import { sendSuccess } from '../utils/api-response';

export async function getHealth(_req: Request, res: Response): Promise<void> {
  const dbUp = await isDatabaseHealthy();
  sendSuccess(res, { status: dbUp ? 'ok' : 'degraded', db: dbUp ? 'up' : 'down' }, dbUp ? 200 : 503);
}
