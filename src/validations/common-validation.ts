import * as z from 'zod';

import { numbersOnlyString } from './common-validation-regex.ts';

export const idParameterSchema = z.object({
  id: z.string().max(16).regex(numbersOnlyString), // `${Number.MAX_SAFE_INTEGER}`.length -> 16
});
