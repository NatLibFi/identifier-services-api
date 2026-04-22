import * as z from 'zod';

import { numbersOnlyString } from './common-validation-regex.ts';

export const idParameterSchema = z.object({
  id: z.string().max(16).regex(numbersOnlyString), // `${Number.MAX_SAFE_INTEGER}`.length -> 16
});

export const contactPersonSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.email().max(100).nullable(),
});

export const commonSearchSchema = z
  .object({
    search_text: z.string().max(100).optional(),
    limit: z.number().min(1).max(50),
    offset: z.number().min(0).max(100000),
  })
  .strict();

export type CommonSearchHttp = z.infer<typeof commonSearchSchema>;
