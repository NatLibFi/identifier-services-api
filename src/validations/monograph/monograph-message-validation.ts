import * as z from 'zod';

import { LANG_CODES, MONOGRAPH_MESSAGE_TYPES } from '../../constants.ts';

export const createMonographMessageFromTemplateSchema = z
  .object({
    message_type: z.enum(Object.keys(MONOGRAPH_MESSAGE_TYPES)),
    monograph_publisher_id: z.number(),
    monograph_identifier_batch_id: z.number().optional(),
    manifestation_ids: z.array(z.number()).optional(),
  })
  .strict();

export const sendMonographMessageSchema = z
  .object({
    message_type: z.enum(Object.keys(MONOGRAPH_MESSAGE_TYPES)),
    monograph_publisher_id: z.number(),
    monograph_publication_request_id: z.number().nullable(),
    monograph_identifier_batch_id: z.number().nullable(),
    isbn_publisher_range_id: z.number().nullable(),
    ismn_publisher_range_id: z.number().nullable(),
    manifestation_ids: z.array(z.number()),
    recipient: z.email(),
    subject: z.string().max(150),
    body: z.string(),
    lang_code: z.enum(Object.keys(LANG_CODES)),
  })
  .strict();

export const resendMonographMessageSchema = z
  .object({
    recipient: z.email(),
  })
  .strict();

export const searchMonographMessageSchema = z
  .object({
    monograph_publisher_id: z.number().optional(),
    monograph_publication_request_id: z.number().optional(),
    search_text: z.string().max(100).optional(),
    limit: z.number().min(1).max(50),
    offset: z.number().min(0).max(100000),
  })
  .strict()
  .superRefine((data, ctx) => {
    const hasPublisherId = Boolean(data.monograph_publisher_id);
    const hasPublicationId = Boolean(data.monograph_publication_request_id);
    const hasSearchText = typeof data.search_text === 'string';

    const searchTypesAsked = [hasPublisherId, hasPublicationId, hasSearchText];
    const tooManySearchTypes = searchTypesAsked.filter((searchType) => searchType === true).length > 1;
    const noSearchTypeDefined = searchTypesAsked.filter((searchType) => searchType === true).length === 0;

    if (tooManySearchTypes) {
      const issuePlacement = hasPublisherId ? 'monograph_publisher_id' : 'monograph_publication_request_id';
      ctx.addIssue({
        path: [issuePlacement],
        code: 'custom',
        message:
          'You may only define one of following: monograph_publisher_id, monograph_publication_request_id, or search_text',
      });
    }

    if (noSearchTypeDefined) {
      ctx.addIssue({
        path: ['search_text'],
        code: 'custom',
        message: 'Please define search_text, monograph_publisher_id or monograph_publication_request_id',
      });
    }
  });

export type CreateMonographMessageFromTemplate = z.infer<typeof createMonographMessageFromTemplateSchema>;
export type SendMonographMessage = z.infer<typeof sendMonographMessageSchema>;
export type ResendMonographMessage = z.infer<typeof resendMonographMessageSchema>;
export type SearchMonographMessage = z.infer<typeof searchMonographMessageSchema>;
