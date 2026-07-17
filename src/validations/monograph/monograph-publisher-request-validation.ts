import * as z from 'zod';

import { langCodeEnum } from '../common-validation-enum.ts';
import { MONOGRAPH_PUBLISHER_CLASSIFICATION_CODES } from '../../constants.ts';

// Note that V1 schema uses camelCase for compatibility, V2 and onwards uses always snake_case
export const createMonographPublisherRequestSchemaV1 = z
  .object({
    version: z.literal(1), // This schema must explicitly define use of v1
    officialName: z.string().min(1).max(100),
    otherNames: z.string().max(200).nullable().optional(),
    contactPerson: z.string().min(1).max(100),
    address: z.string().min(1).max(50),
    zip: z.string().min(1).max(10),
    city: z.string().min(1).max(50),
    phone: z.string().min(1).max(30),
    email: z.email().min(1).max(100),
    www: z.string().max(100).nullable().optional(),
    langCode: z.enum(langCodeEnum),
    frequencyCurrent: z.string().max(50).nullable().optional(),
    frequencyNext: z.string().max(50).nullable().optional(),
    affiliateOf: z.string().max(50).nullable().optional(),
    affiliates: z.string().max(200).nullable().optional(),
    distributorOf: z.string().max(200).nullable().optional(),
    distributors: z.string().max(50).nullable().optional(),
    classification: z.array(z.enum(MONOGRAPH_PUBLISHER_CLASSIFICATION_CODES)).max(6).optional(),
    classificationOther: z.string().max(50).nullable().optional(),
    turnstileToken: z.string().nullable().optional(),
  })
  .strict();

export const createMonographPublisherRequestSchemaV2 = z
  .object({
    version: z.literal(2), // This schema must explicitly define use of v2
    official_name: z.string().min(1).max(100),
    other_names: z.array(z.string().min(1).max(50)).max(8),
    contact_persons: z.array(
      z.object({
        name: z.string().min(1).max(100),
        email: z.email().nullable(),
      }),
    ),
    address: z.string().min(1).max(50),
    zip: z.string().min(1).max(10),
    city: z.string().min(1).max(50),
    phone: z.string().min(1).max(30),
    email: z.email().min(1).max(100),
    www: z.string().max(100).nullable().optional(),
    lang_code: z.enum(langCodeEnum),
    frequency_current: z.string().max(50).nullable().optional(),
    frequency_next: z.string().max(50).nullable().optional(),
    affiliate_of: z.string().max(50).nullable().optional(),
    affiliates: z.string().max(200).nullable().optional(),
    distributor_of: z.string().max(200).nullable().optional(),
    distributors: z.string().max(50).nullable().optional(),
    classifications: z.array(z.enum(MONOGRAPH_PUBLISHER_CLASSIFICATION_CODES)).max(6).optional(),
    classification_other: z.string().max(50).nullable().optional(),
    turnstile_token: z.string().optional(),
  })
  .strict();

export const updateMonographPublisherRequestSchema = z
  .object({
    official_name: z.string().min(1).max(100).optional(),
    other_names: z.array(z.string().min(1).max(50)).max(8).optional(),
    contact_persons: z
      .array(
        z.object({
          name: z.string().min(1).max(100),
          email: z.email().nullable(),
        }),
      )
      .optional(),
    address: z.string().min(1).max(50).nullable().optional(),
    zip: z.string().min(1).max(10).nullable().optional(),
    city: z.string().min(1).max(50).nullable().optional(),
    phone: z.string().min(1).max(30).nullable().optional(),
    email: z.email().min(1).max(100).nullable().optional(),
    www: z.string().max(100).nullable().optional(),
    lang_code: z.enum(langCodeEnum).optional(),
    frequency_current: z.string().max(50).nullable().optional(),
    frequency_next: z.string().max(50).nullable().optional(),
    affiliate_of: z.string().max(50).nullable().optional(),
    affiliates: z.string().max(200).nullable().optional(),
    distributor_of: z.string().max(200).nullable().optional(),
    distributors: z.string().max(50).nullable().optional(),
    classifications: z.array(z.enum(MONOGRAPH_PUBLISHER_CLASSIFICATION_CODES)).max(6).optional(),
    classification_other: z.string().max(50).nullable().optional(),
    additional_info: z.string().max(2000).nullable().optional(),
  })
  .strict();

// Use discriminated union on "version" attribute to validate request against the desired version
export const createMonographPublisherRequestSchema = z.discriminatedUnion('version', [
  createMonographPublisherRequestSchemaV1,
  createMonographPublisherRequestSchemaV2,
]);

export type CreateMonographPublisherRequestV1Http = z.infer<typeof createMonographPublisherRequestSchemaV1>;
export type CreateMonographPublisherRequestV2Http = z.infer<typeof createMonographPublisherRequestSchemaV2>;
export type UpdateMonographPublisherRequestHttp = z.infer<typeof updateMonographPublisherRequestSchema>;
