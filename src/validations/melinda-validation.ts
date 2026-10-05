import * as z from 'zod';

import { MARC_RECORD_FILTER } from '../constants.ts';

export const sendToMelindaSchema = z
  .object({
    monograph_expression_id: z.number().optional(),
    serial_publication_id: z.number().optional(),
    record_filter: z.enum(Object.values(MARC_RECORD_FILTER)).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    // Either monograph or serial entry needs to be defined
    if (!data.monograph_expression_id && !data.serial_publication_id) {
      ctx.addIssue({
        path: ['monograph_expression_id'],
        code: 'custom',
        message: 'Either monograph_expression_id or serial_publication_id is required to be defined',
      });
    }

    // Cannot defined both simultaneously: monograph and serial entries
    if (!data.monograph_expression_id && !data.serial_publication_id) {
      ctx.addIssue({
        path: ['monograph_expression_id'],
        code: 'custom',
        message: 'Cannot define both monograph_expression_id and serial_publication_id',
      });
    }
  });

export type SendToMelindaHttp = z.infer<typeof sendToMelindaSchema>;
