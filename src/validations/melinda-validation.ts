import * as z from 'zod';

import { MARC_RECORD_FILTER } from '../constants.ts';

export const sendToMelindaSchema = z
  .object({
    monograph_expression_id: z.number().optional(),
    record_filter: z.enum(Object.values(MARC_RECORD_FILTER)).optional(),
  })
  .strict();

export type SendToMelindaHttp = z.infer<typeof sendToMelindaSchema>;
