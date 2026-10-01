import * as z from 'zod';

import { LANG_CODES, SERIAL_MESSAGE_TYPES } from '../../constants.ts';

export const createSerialMessageFromTemplateSchema = z
  .object({
    message_type: z.enum(Object.keys(SERIAL_MESSAGE_TYPES)),
    serial_publisher_id: z.number(),
    serial_publication_request_id: z.number().optional(),
  })
  .strict();

export const sendSerialMessageSchema = z
  .object({
    message_type: z.enum(Object.keys(SERIAL_MESSAGE_TYPES)),
    serial_publisher_id: z.number(),
    serial_publication_request_id: z.number().nullable(),
    recipient: z.email(),
    subject: z.string().max(150),
    body: z.string(),
    lang_code: z.enum(Object.keys(LANG_CODES)),
  })
  .strict();

export const resendSerialMessageSchema = z
  .object({
    recipient: z.email(),
  })
  .strict();

export const searchSerialMessageSchema = z
  .object({
    serial_publisher_id: z.number().optional(),
    serial_publication_request_id: z.number().optional(),
    search_text: z.string().max(100).optional(),
    limit: z.number().min(1).max(50),
    offset: z.number().min(0).max(100000),
  })
  .strict()
  .superRefine((data, ctx) => {
    const hasPublisherId = Boolean(data.serial_publisher_id);
    const hasPublicationRequestId = Boolean(data.serial_publication_request_id);
    const hasSearchText = typeof data.search_text === 'string';

    const searchTypesAsked = [hasPublisherId, hasPublicationRequestId, hasSearchText];
    const tooManySearchTypes = searchTypesAsked.filter((searchType) => searchType === true).length > 1;
    const noSearchTypeDefined = searchTypesAsked.filter((searchType) => searchType === true).length === 0;

    if (tooManySearchTypes) {
      const issuePlacement = hasPublisherId ? 'serial_publisher_id' : 'serial_publication_request_id';
      ctx.addIssue({
        path: [issuePlacement],
        code: 'custom',
        message:
          'You may only define one of following: serial_publisher_id, serial_publication_request_id, or search_text',
      });
    }

    if (noSearchTypeDefined) {
      ctx.addIssue({
        path: ['search_text'],
        code: 'custom',
        message: 'Please define search_text, serial_publisher_id or serial_publication_request_id',
      });
    }
  });

export type CreateSerialMessageFromTemplate = z.infer<typeof createSerialMessageFromTemplateSchema>;
export type SendSerialMessage = z.infer<typeof sendSerialMessageSchema>;
export type ResendSerialMessage = z.infer<typeof resendSerialMessageSchema>;
export type SearchSerialMessage = z.infer<typeof searchSerialMessageSchema>;
