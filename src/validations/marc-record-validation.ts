import * as z from 'zod';

import { MARC_RECORD_FILTER, MARC_RECORD_FORMAT } from '../constants.ts';

export const getMarcRecordSchema = z
  .object({
    record_format: z.enum(Object.values(MARC_RECORD_FORMAT)),
    record_filter: z.enum(Object.values(MARC_RECORD_FILTER)).optional(),
  })
  .strict();

export type GetMarcRecordHttp = z.infer<typeof getMarcRecordSchema>;
