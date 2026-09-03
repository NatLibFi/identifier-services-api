import * as z from 'zod';

import { numbersOnlyString } from '../common-validation-regex.ts';

export const createIssnRangeSchema = z
  .object({
    block: z.string().min(4).max(4).regex(numbersOnlyString),
    range_begin: z.string().min(3).max(3).regex(numbersOnlyString),
    range_end: z.string().min(3).max(3).regex(numbersOnlyString),
  })
  .strict()
  .superRefine((data, ctx) => {
    const beginAsNumber = Number(data.range_begin);
    const endAsNumber = Number(data.range_end);

    if (isNaN(beginAsNumber)) {
      ctx.addIssue({
        path: ['range_begin'],
        code: 'custom',
        message: 'Range begin must be a number',
      });
    }

    if (isNaN(endAsNumber)) {
      ctx.addIssue({
        path: ['range_end'],
        code: 'custom',
        message: 'Range end must be a number',
      });
    }

    if (beginAsNumber > endAsNumber) {
      ctx.addIssue({
        path: ['range_begin'],
        code: 'custom',
        message: 'range_begin must be greater than range_end',
      });
    }
  });

export const updateIssnRangeSchema = z
  .object({
    active: z.boolean(),
  })
  .strict();

export type CreateIssnRangeHttp = z.infer<typeof createIssnRangeSchema>;
export type UpdateIssnRangeHttp = z.infer<typeof updateIssnRangeSchema>;
