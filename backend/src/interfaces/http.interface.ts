import type { Request } from 'express';

export interface LoanIdParams {
  loanId: string;
}

interface RequestShape {
  body?: unknown;
  query?: unknown;
  params?: unknown;
}

/** A request whose body / query / params were already parsed by the `validate` middleware. */
export type ValidatedRequest<S extends RequestShape> = Omit<Request, 'body' | 'query' | 'params'> & {
  body: S extends { body: infer B } ? B : unknown;
  query: S extends { query: infer Q } ? Q : unknown;
  params: S extends { params: infer P } ? P : Record<string, string>;
};
