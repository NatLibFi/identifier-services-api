import * as z from 'zod';

import {
  publicationLanguageEnum,
  serialFrequencyEnum,
  serialMediumEnum,
  serialPublicationStatusEnum,
  serialPublicationTypeEnum,
} from '../common-validation-enum.ts';
import { issnLikeString, yearString } from '../common-validation-regex.ts';

export const createSerialPublicationSchema = z.object({
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
    .optional(),
  main_series: z
    .array(
      z.object({
        title: z.string().max(100),
        issn: z.string().regex(issnLikeString).optional().nullable(),
      }),
    )
    .max(5)
    .optional(),
  subseries: z
    .array(
      z.object({
        title: z.string().max(100),
        issn: z.string().regex(issnLikeString).optional().nullable(),
      }),
    )
    .max(5)
    .optional(),
  another_medium: z
    .array(
      z.object({
        title: z.string().max(100),
        issn: z.string().regex(issnLikeString).optional().nullable(),
      }),
    )
    .max(5)
    .optional(),
  additional_info: z.string().max(2000).nullable().optional(),
});

export const updateSerialPublicationSchema = z.object({
  title: z.string().max(200).optional(),
  subtitle: z.string().max(200).nullable().optional(),
  place_of_publication: z.string().max(100).nullable().optional(),
  printer: z.string().max(100).nullable().optional(),
  issued_from_year: z.string().min(4).max(4).regex(yearString).optional(),
  issued_from_number: z.string().max(100).nullable().optional(),
  frequency: z.enum(serialFrequencyEnum).optional(),
  frequency_other: z.string().max(50).nullable().optional(),
  language: z.enum(publicationLanguageEnum).optional(),
  publication_type: z.enum(serialPublicationTypeEnum).optional(),
  publication_type_other: z.string().max(50).nullable().optional(),
  medium: z.enum(serialMediumEnum).optional(),
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
    .optional(),
  main_series: z
    .array(
      z.object({
        title: z.string().max(100),
        issn: z.string().regex(issnLikeString).optional().nullable(),
      }),
    )
    .max(5)
    .optional(),
  subseries: z
    .array(
      z.object({
        title: z.string().max(100),
        issn: z.string().regex(issnLikeString).optional().nullable(),
      }),
    )
    .max(5)
    .optional(),
  another_medium: z
    .array(
      z.object({
        title: z.string().max(100),
        issn: z.string().regex(issnLikeString).optional().nullable(),
      }),
    )
    .max(5)
    .optional(),
  status: z.enum(serialPublicationStatusEnum).optional(),
  additional_info: z.string().max(2000).nullable().optional(),
});

export const searchSerialPublicationSchema = z
  .object({
    search_text: z.string().max(100).optional(),
    serial_publisher_id: z.number().max(Number.MAX_SAFE_INTEGER).optional(),
    status: z.enum(serialPublicationStatusEnum).optional(),
    limit: z.number().min(1).max(50),
    offset: z.number().min(0).max(100000),
  })
  .strict();

export type CreateSerialPublicationHttp = z.infer<typeof createSerialPublicationSchema>;
export type UpdateSerialPublicationHttp = z.infer<typeof updateSerialPublicationSchema>;

export type SearchSerialPublicationHttp = z.infer<typeof searchSerialPublicationSchema>;
