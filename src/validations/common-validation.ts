import * as z from 'zod';

import { numbersOnlyString } from './common-validation-regex.ts';

export const idParameterSchema = z.object({
  id: z.string().max(16).regex(numbersOnlyString), // `${Number.MAX_SAFE_INTEGER}`.length -> 16
});

export const contactPersonSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.email().max(100).nullable(),
});
