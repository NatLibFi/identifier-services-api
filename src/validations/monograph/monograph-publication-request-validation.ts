import * as z from 'zod';
import { monographPublicationRequestStateEnum } from '../common-validation-enum.ts';

export const searchMonographPublicationRequestSchema = z
  .object({
    search_text: z.string().max(100).optional(),
    request_state: z.enum(monographPublicationRequestStateEnum).optional().nullable(),
    limit: z.number().min(1).max(50),
    offset: z.number().min(0).max(100000),
  })
  .strict();

export type SearchMonographPublicationRequestHttp = z.infer<typeof searchMonographPublicationRequestSchema>;
