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
  .strict()
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

export const updateIsbnRangeSchema = z
  .object({
    active: z.boolean().optional(),
    range_begin: z.string().min(1).max(5).regex(numbersOnlyString).optional(),
    range_end: z.string().min(1).max(5).regex(numbersOnlyString).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const beginNumber = data.range_begin ? Number(data.range_begin.replaceAll(/^0+/g, '')) : undefined;
    const endNumber = data.range_end ? Number(data.range_end.replaceAll(/^0+/g, '')) : undefined;

    if (beginNumber && isNaN(beginNumber)) {
      ctx.addIssue({
        path: ['range_begin'],
        code: 'custom',
        message: 'Range begin could not be interpreted as number',
      });
    }

    if (endNumber && isNaN(endNumber)) {
      ctx.addIssue({
        path: ['range_end'],
        code: 'custom',
        message: 'Range end could not be interpreted as number',
      });
    }

    if (beginNumber && endNumber && beginNumber > endNumber) {
      ctx.addIssue({
        path: ['range_begin'],
        code: 'custom',
        message: 'Range begin cannot be less than range end',
      });
    }

    const activeIsSet = data.active !== undefined;
    const activeAndEdit = activeIsSet && (beginNumber !== undefined || endNumber !== undefined);

    if (activeAndEdit) {
      ctx.addIssue({
        path: ['active'],
        code: 'custom',
        message: 'Having active and range_begin/range_end adjusted simultaneously is not allowed',
      });
    }

    const noOperationDefined = [data.active, data.range_begin, data.range_end].every(
      (attribute) => attribute === undefined,
    );

    if (noOperationDefined) {
      ctx.addIssue({
        path: ['active'],
        code: 'custom',
        message: 'No attribute to edit was defined',
      });
    }
  });

export type CreateIsbnRangeHttp = z.infer<typeof createIsbnRangeSchema>;
export type UpdateIsbnRangeHttp = z.infer<typeof updateIsbnRangeSchema>;
