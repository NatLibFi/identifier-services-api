import * as z from 'zod';

import { langCodeEnum } from '../common-validation-enum.ts';
import { contactPersonSchema } from '../common-validation.ts';

export const createSerialPublisherSchema = z
  .object({
    official_name: z.string().min(1).max(100),
    contact_persons: z.array(contactPersonSchema).max(10),
    lang_code: z.enum(langCodeEnum),
    email_common: z.email().max(100).nullable().optional(),
    phone: z.string().max(30).nullable().optional(),
    address: z.string().max(100).nullable().optional(),
    zip: z.string().max(10).nullable().optional(),
    city: z.string().max(50).nullable().optional(),
    additional_info: z.string().max(2000).nullable().optional(),
  })
  .strict();

export const updateSerialPublisherSchema = z
  .object({
    official_name: z.string().min(1).max(100).optional(),
    contact_persons: z.array(contactPersonSchema).max(10).optional(),
    email_common: z.email().max(100).nullable().optional(),
    phone: z.string().max(30).nullable().optional(),
    address: z.string().max(100).nullable().optional(),
    zip: z.string().max(10).nullable().optional(),
    city: z.string().max(50).nullable().optional(),
    lang_code: z.enum(langCodeEnum).optional(),
    additional_info: z.string().max(2000).nullable().optional(),
  })
  .strict();

export const searchSerialPublisherSchema = z
  .object({
    search_text: z.string().max(100).optional(),
    limit: z.number().min(1).max(50),
    offset: z.number().min(0).max(100000),
  })
  .strict();

export const serialPublisherAutocompleteSchema = z
  .object({
    search_text: z.string().max(100),
  })
  .strict();

export type CreateSerialPublisherHttp = z.infer<typeof createSerialPublisherSchema>;
export type UpdateSerialPublisherHttp = z.infer<typeof updateSerialPublisherSchema>;
export type SearchSerialPublisherHttp = z.infer<typeof searchSerialPublisherSchema>;
export type AutocompleteSerialPublisherHttp = z.infer<typeof serialPublisherAutocompleteSchema>;
