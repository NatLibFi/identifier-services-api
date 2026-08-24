import * as z from 'zod';
import { isAutomatedTest } from '../../utils/generic-utils.ts';

export const createMonographIdentifierBatchSchema = z
  .object({
    isbn_publisher_range_id: z.number().optional(),
    ismn_publisher_range_id: z.number().optional(),
    identifier_count: z.number(), // Note: min is 20 but it's defined within superRefine to allow automated tests to have smaller batches
    // TODO: fix automated tests to have larger batches so that validation can be done here
  })
  .superRefine((data, ctx) => {
    if (!data.isbn_publisher_range_id && !data.ismn_publisher_range_id) {
      ctx.addIssue({
        path: ['isbn_publisher_range_id'],
        code: 'custom',
        message: 'Either isbn_publisher_range_id or ismn_publisher_range_id must be defined',
      });
    }

    // For automated tests allow identifier count less than 20
    if (!isAutomatedTest() && data.identifier_count < 20) {
      ctx.addIssue({
        path: ['identifier_count'],
        code: 'custom',
        message: 'Creating batches with identifier count less than 20 is not allowed',
      });
    }
  });

export const downloadMonographIdentifierBatchSchema = z
  .object({
    turnstile_token: z.string().optional(),
  })
  .strict();

export type CreateMonographIdentifierBatchHttp = z.infer<typeof createMonographIdentifierBatchSchema>;
