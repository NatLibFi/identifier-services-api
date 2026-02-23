import * as z from 'zod';

import { ISBN_VALID_GS1, ISBN_VALID_REGISTRATION_GROUPS } from '../../constants/monograph/isbn-constants.ts';
import { numbersOnlyString } from '../common-validation-regex.ts';

export const createIsbnRangeSchema = z
  .object({
    gs1: z.enum(Object.values(ISBN_VALID_GS1)),
    registration_group: z.enum(Object.values(ISBN_VALID_REGISTRATION_GROUPS)),
    range_begin: z.string().min(1).max(5).regex(numbersOnlyString),
    range_end: z.string().min(1).max(5).regex(numbersOnlyString),
  })
  .superRefine((data, ctx) => {
    const rangeLengthConsistent = data.range_begin.length === data.range_end.length;
    if (!rangeLengthConsistent) {
      ctx.addIssue({
        path: ['range_begin'],
        code: 'custom',
        message: 'Range begin and range end length is not consistent',
      });
    }

    const beginNumber = Number(data.range_begin.replaceAll(/^0+/g, ''));
    const endNumber = Number(data.range_end.replaceAll(/^0+/g, ''));

    if (isNaN(beginNumber)) {
      ctx.addIssue({
        path: ['range_begin'],
        code: 'custom',
        message: 'Range begin could not be interpreted as number',
      });
    }

    if (isNaN(endNumber)) {
      ctx.addIssue({
        path: ['range_end'],
        code: 'custom',
        message: 'Range end could not be interpreted as number',
      });
    }

    if (beginNumber > endNumber) {
      ctx.addIssue({
        path: ['range_begin'],
        code: 'custom',
        message: 'Range begin cannot be less than range end',
      });
    }
  });

export type CreateIsbnRangeHttp = z.infer<typeof createIsbnRangeSchema>;
