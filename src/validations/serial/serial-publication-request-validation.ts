import * as z from 'zod';

import {
  langCodeEnum,
  publicationLanguageEnum,
  serialFrequencyEnum,
  serialMediumEnum,
  serialPublicationRequestStatusEnum,
  serialPublicationTypeEnum,
} from '../common-validation-enum.ts';
import { issnLikeString, yearString } from '../common-validation-regex.ts';

export const createSerialPublicationRequestV1Schema = z
  .object({
    version: z.literal(1), // This schema must explicitly define use of v1
    form: z.object({
      publisher: z.string().max(100),
      contactPerson: z.string().max(100),
      email: z.email().max(100),
      phone: z.string().max(30).nullable().optional(),
      address: z.string().max(50).nullable().optional(),
      zip: z.string().max(10).nullable().optional(),
      city: z.string().max(50).nullable().optional(),
      langCode: z.enum(langCodeEnum),
    }),
    publications: z
      .array(
        z.object({
          title: z.string().max(200),
          subtitle: z.string().max(200).nullable().optional(),
          placeOfPublication: z.string().max(100).nullable().optional(),
          printer: z.string().max(100).nullable().optional(),
          issuedFromYear: z.string().min(4).max(4).regex(yearString),
          issuedFromNumber: z.string().max(100).nullable().optional(),
          frequency: z.enum(serialFrequencyEnum),
          frequencyOther: z.string().max(50).nullable().optional(),
          language: z.enum(publicationLanguageEnum),
          publicationType: z.enum(serialPublicationTypeEnum),
          publicationTypeOther: z.string().max(50).nullable().optional(),
          medium: z.enum(serialMediumEnum),
          mediumOther: z.string().max(50).nullable().optional(),
          url: z.string().max(100).nullable().optional(),
          previous: z
            .object({
              title: z.array(z.string().max(100)).max(5),
              issn: z.array(z.string().regex(issnLikeString)).max(5),
              lastIssue: z.array(z.string().max(50)).max(5),
            })
            .nullable()
            .optional(),
          mainSeries: z
            .object({
              title: z.array(z.string().max(100)).max(5),
              issn: z.array(z.string().regex(issnLikeString)).max(5),
            })
            .nullable()
            .optional(),
          subseries: z
            .object({
              title: z.array(z.string().max(100)).max(5),
              issn: z.array(z.string().regex(issnLikeString)).max(5),
            })
            .nullable()
            .optional(),
          anotherMedium: z
            .object({
              title: z.array(z.string().max(100)).max(5),
              issn: z.array(z.string().regex(issnLikeString)).max(5),
            })
            .nullable()
            .optional(),
          additionalInfo: z.string().max(2000).nullable().optional(),
        }),
      )
      .min(1)
      .max(4),
  })
  .strict();

export const createSerialPublicationRequestV2Schema = z
  .object({
    version: z.literal(2), // This schema must explicitly define use of v2
    form: z.object({
      publisher_name: z.string().max(100),
      contact_person: z.string().max(100),
      email: z.email().max(100),
      phone: z.string().max(30).nullable().optional(),
      address: z.string().max(50).nullable().optional(),
      zip: z.string().max(10).nullable().optional(),
      city: z.string().max(50).nullable().optional(),
      lang_code: z.enum(langCodeEnum),
    }),
    publications: z
      .array(
        z.object({
          title: z.string().max(200),
          subtitle: z.string().max(200).nullable().optional(),
          place_of_publication: z.string().max(100).nullable().optional(),
          printer: z.string().max(100).nullable().optional(),
          issued_from_year: z.string().min(4).max(4).regex(yearString),
          issued_from_number: z.string().max(100).nullable().optional(),
          frequency: z.enum(serialFrequencyEnum),
          frequency_other: z.string().max(50).nullable().optional(),
          language: z.enum(publicationLanguageEnum),
          publication_type: z.enum(serialPublicationTypeEnum),
          publication_type_other: z.string().max(50).nullable().optional(),
          medium: z.enum(serialMediumEnum),
          medium_other: z.string().max(50).nullable().optional(),
          url: z.string().max(100).nullable().optional(),
          previous: z
            .array(
              z.object({
                title: z.string().max(100),
                issn: z.string().regex(issnLikeString).optional().nullable(),
                lastIssue: z.string().max(50).optional().nullable(),
              }),
            )
            .max(5)
            .nullable()
            .optional(),
          main_series: z
            .array(
              z.object({
                title: z.string().max(100),
                issn: z.string().regex(issnLikeString).optional().nullable(),
              }),
            )
            .max(5)
            .nullable()
            .optional(),
          subseries: z
            .array(
              z.object({
                title: z.string().max(100),
                issn: z.string().regex(issnLikeString).optional().nullable(),
              }),
            )
            .max(5)
            .nullable()
            .optional(),
          another_medium: z
            .array(
              z.object({
                title: z.string().max(100),
                issn: z.string().regex(issnLikeString).optional().nullable(),
              }),
            )
            .max(5)
            .nullable()
            .optional(),
          additional_info: z.string().max(2000).nullable().optional(),
        }),
      )
      .min(1)
      .max(4),
  })
  .strict();

export const updateSerialPublicationRequestSchema = z.object({
  publisher_name: z.string().max(100).optional(),
  contact_person: z.string().max(100).optional(),
  email: z.email().max(100).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  address: z.string().max(50).nullable().optional(),
  zip: z.string().max(10).nullable().optional(),
  city: z.string().max(50).nullable().optional(),
  lang_code: z.enum(langCodeEnum).optional(),
  status: z.enum(serialPublicationRequestStatusEnum).optional(), // Note: business logic constraints exist
  serial_publisher_id: z.number().min(1).max(Number.MAX_SAFE_INTEGER).nullable().optional(), // Note: business logic constraints exist
});

// Use discriminated union on "version" attribute to validate request against the desired version
export const createSerialPublicationRequestSchema = z.discriminatedUnion('version', [
  createSerialPublicationRequestV1Schema,
  createSerialPublicationRequestV2Schema,
]);

export const searchSerialPublicationRequestSchema = z.object({
  search_text: z.string().max(100).optional(),
  status: z.enum(serialPublicationRequestStatusEnum).optional().nullable(),
  serial_publisher_id: z.number().min(1).max(Number.MAX_SAFE_INTEGER).optional(),
  limit: z.number().min(1).max(50),
  offset: z.number().min(0).max(100000),
});

export type CreateSerialPublicationRequestHttp = z.infer<typeof createSerialPublicationRequestSchema>;

export type CreateSerialPublicationRequestV1Http = z.infer<typeof createSerialPublicationRequestV1Schema>;
export type CreateSerialPublicationRequestV2Http = z.infer<typeof createSerialPublicationRequestV2Schema>;

export type UpdateSerialPublicationRequestHttp = z.infer<typeof updateSerialPublicationRequestSchema>;

export type SearchSerialPublicationRequestHttp = z.infer<typeof searchSerialPublicationRequestSchema>;
