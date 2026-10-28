import * as z from 'zod';

import { MARC_RECORD_FILTER } from '../constants.ts';

export const sendToMelindaSchema = z
  .object({
    monograph_expression_id: z.number().optional(),
    monograph_manifestation_id: z.number().optional(),
    serial_publication_id: z.number().optional(),
    record_filter: z.enum(Object.values(MARC_RECORD_FILTER)).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    // Either monograph or serial entry needs to be defined
    if (!data.monograph_expression_id && !data.monograph_manifestation_id && !data.serial_publication_id) {
      ctx.addIssue({
        path: ['monograph_expression_id'],
        code: 'custom',
        message:
          'Either monograph_expression_id, monograph_manifestation_id or serial_publication_id is required to be defined',
      });
    }

    // To find out how many entry ids are defined simultaneously
    // In proper request only one should be defined
    const dataEntryIds = [
      data.monograph_expression_id,
      data.monograph_manifestation_id,
      data.serial_publication_id,
    ].filter((v) => v);

    if (dataEntryIds.length > 1) {
      ctx.addIssue({
        path: ['monograph_expression_id'],
        code: 'custom',
        message:
          'Cannot define more than one of following: monograph_expression_id, monograph_manifestation_id, serial_publication_id',
      });
    }
  });

export type SendToMelindaHttp = z.infer<typeof sendToMelindaSchema>;
