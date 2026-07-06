import * as z from 'zod';

import { MONOGRAPH_MESSAGE_TYPES } from '../../constants.ts';

export const createMonographMessageFromTemplateSchema = z
  .object({
    type: z.enum(Object.keys(MONOGRAPH_MESSAGE_TYPES)),
    monograph_publisher_id: z.number(),
    isbn_publisher_range_id: z.number().optional(),
    ismn_publisher_range_id: z.number().optional(),
    manifestation_ids: z.array(z.number()).optional(),
  })
  .strict();

export const sendMonographMessageSchema = z
  .object({
    monograph_publisher_id: z.number(),
    isbn_publisher_range_id: z.number().optional(),
    ismn_publisher_range_id: z.number().optional(),
    manifestation_ids: z.array(z.number()).optional(),
    recipient: z.email(),
    subject: z.string().max(150),
    body: z.string(),
  })
  .strict();

export type CreateMonographMessageFromTemplate = z.infer<typeof createMonographMessageFromTemplateSchema>;
