import * as z from 'zod';
import { LANG_CODES, MONOGRAPH_MESSAGE_TYPES } from '../constants.ts';

export const getMessageTemplateSchema = z.object({
  message_type: z.union([z.enum(MONOGRAPH_MESSAGE_TYPES)]),
  lang_code: z.enum(LANG_CODES),
});

export const updateMessageTemplateSchema = z.object({
  subject: z.string().max(150).optional(),
  body: z.string().max(65535).optional(), // MySQL TEXT limit
});

export type MessageTemplateRetrieveHttpParams = z.infer<typeof getMessageTemplateSchema>;
export type MessageTemplateUpdateHttpBody = z.infer<typeof updateMessageTemplateSchema>;
