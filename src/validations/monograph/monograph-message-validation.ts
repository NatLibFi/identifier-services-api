import * as z from 'zod';

import { LANG_CODES, MONOGRAPH_MESSAGE_TYPES } from '../../constants.ts';

export const createMonographMessageFromTemplateSchema = z
  .object({
    message_type: z.enum(Object.keys(MONOGRAPH_MESSAGE_TYPES)),
    monograph_publisher_id: z.number(),
    isbn_publisher_range_id: z.number().optional(),
    ismn_publisher_range_id: z.number().optional(),
    manifestation_ids: z.array(z.number()).optional(),
  })
  .strict();

export const sendMonographMessageSchema = z
  .object({
    message_type: z.enum(Object.keys(MONOGRAPH_MESSAGE_TYPES)),
    monograph_publisher_id: z.number(),
    monograph_publication_request_id: z.number().nullable(),
    isbn_publisher_range_id: z.number().nullable(),
    ismn_publisher_range_id: z.number().nullable(),
    manifestation_ids: z.array(z.number()),
    recipient: z.email(),
    subject: z.string().max(150),
    body: z.string(),
    lang_code: z.enum(Object.keys(LANG_CODES)),
  })
  .strict();

export type CreateMonographMessageFromTemplate = z.infer<typeof createMonographMessageFromTemplateSchema>;
export type SendMonographMessage = z.infer<typeof sendMonographMessageSchema>;
