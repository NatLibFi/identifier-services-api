import * as z from 'zod';

import { langCodeEnum, monographIdentifierEnum } from '../common-validation-enum.ts';
import { contactPersonSchema } from '../common-validation.ts';
import { MONOGRAPH_IDENTIFIERS, MONOGRAPH_PUBLISHER_CLASSIFICATION_CODES } from '../../constants.ts';

export const updateMonographPublisherSchema = z
  .object({
    official_name: z.string().min(1).max(100).optional(),
    other_names: z.array(z.string().min(1).max(100)).max(10).optional(),
    previous_names: z.array(z.string().min(1).max(100)).max(10).optional(),
    address: z.string().max(100).nullable().optional(),
    zip: z.string().max(10).nullable().optional(),
    city: z.string().max(50).nullable().optional(),
    phone: z.string().max(30).nullable().optional(),
    email: z.email().max(100).nullable().optional(),
    www: z.string().max(100).nullable().optional(),
    lang_code: z.enum(langCodeEnum).optional(),
    contact_persons: z.array(contactPersonSchema).max(10).optional(),
    additional_info: z.string().max(2000).nullable().optional(),
    has_quitted: z.boolean().optional(),
    year_quitted: z.number().min(1900).max(65535).nullable().optional(),
    frequency_current: z.string().max(50).nullable().optional(),
    frequency_next: z.string().max(50).nullable().optional(),
    affiliate_of: z.string().max(50).nullable().optional(),
    affiliates: z.string().max(200).nullable().optional(),
    distributor_of: z.string().max(200).nullable().optional(),
    distributors: z.string().max(50).nullable().optional(),
    classifications: z.array(z.enum(MONOGRAPH_PUBLISHER_CLASSIFICATION_CODES)).max(5).optional(),
    classification_other: z.string().max(50).nullable().optional(),
    promote_sorting: z.boolean().optional(),
  })
  .strict();

export const searchMonographPublisherSchema = z
  .object({
    search_text: z.string().max(100).optional(),
    has_quitted: z.boolean().optional(),
    identifier_type: z.enum(monographIdentifierEnum).optional(),
    category: z.number().min(1).max(7).optional(),
    limit: z.number().min(1).max(50),
    offset: z.number().min(0).max(100000),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.category && !data.identifier_type) {
      ctx.addIssue({
        path: ['identifier_type'],
        code: 'custom',
        message: 'Defining identifier_type is mandatory when filtering entries using category',
      });
    }

    const isIsbnType = data.identifier_type === MONOGRAPH_IDENTIFIERS.ISBN;
    const hasValidIsbnCategory = data.category ? data.category < 6 : true;

    const isIsmnType = data.identifier_type === MONOGRAPH_IDENTIFIERS.ISMN;
    const hasValidIsmnCategory = data.category ? data.category > 2 : true;

    if (isIsbnType && !hasValidIsbnCategory) {
      ctx.addIssue({
        path: ['category'],
        code: 'custom',
        message: 'category for ISBN publisher identifiers must be a value between 1 and 5',
      });
    }

    if (isIsmnType && !hasValidIsmnCategory) {
      ctx.addIssue({
        path: ['category'],
        code: 'custom',
        message: 'category for ISMN publisher identifiers must be a value between 3 and 7',
      });
    }
  });

export const monographPublisherAutocompleteSchema = z
  .object({
    search_text: z.string().max(100),
  })
  .strict();

export type UpdateMonographPublisherHttp = z.infer<typeof updateMonographPublisherSchema>;
export type SearchMonographPublisherHttp = z.infer<typeof searchMonographPublisherSchema>;
export type AutocompleteMonographPublisherHttp = z.infer<typeof monographPublisherAutocompleteSchema>;
