import * as z from 'zod';

import { dateString } from '../common-validation-regex.ts';
import { MONOGRAPH_STATISTIC_TYPE, STATISTICS_FORMAT } from '../../constants.ts';

export const createMonographStatistics = z
  .object({
    statistics_type: z.enum(Object.values(MONOGRAPH_STATISTIC_TYPE)),
    output_format: z.enum(Object.values(STATISTICS_FORMAT)),
    begin: z.string().regex(dateString).optional(),
    end: z.string().regex(dateString).optional(),
  })
  .strict();

export type CreateMonographStatisticsHttp = z.infer<typeof createMonographStatistics>;
