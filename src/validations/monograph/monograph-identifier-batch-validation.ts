import * as z from 'zod';

export const createMonographIdentifierBatchSchema = z
  .object({
    isbn_publisher_range_id: z.number().optional(),
    ismn_publisher_range_id: z.number().optional(),
    identifier_count: z.number(),
  })
  .superRefine((data, ctx) => {
    if (!data.isbn_publisher_range_id && !data.ismn_publisher_range_id) {
      ctx.addIssue({
        path: ['isbn_publisher_range_id'],
        code: 'custom',
        message: 'Either isbn_publisher_range_id or ismn_publisher_range_id must be defined',
      });
    }
  });

export const downloadMonographIdentifierBatchSchema = z
  .object({
    turnstile_token: z.string().optional(),
  })
  .strict();

export type CreateMonographIdentifierBatchHttp = z.infer<typeof createMonographIdentifierBatchSchema>;
