import * as z from 'zod';

import { langCodeEnum } from '../common-validation-enum.ts';
import { contactPersonSchema } from '../common-validation.ts';
import { MONOGRAPH_PUBLISHER_CLASSIFICATION_CODES } from '../../constants.ts';

export const updateMonographPublisherSchema = z
  .object({
    official_name: z.string().min(1).max(100).optional(),
    other_names: z.array(z.string().min(1).max(100)).max(10).optional(),
    previous_names: z.array(z.string().min(1).max(100)).max(10).optional(),
    address: z.string().max(100).nullable().optional(),
    zip: z.string().max(10).nullable().optional(),
    city: z.string().max(50).nullable().optional(),
    phone: z.string().max(30).nullable().optional(),
    email: z.email().max(100).optional(),
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

export type UpdateMonographPublisherHttp = z.infer<typeof updateMonographPublisherSchema>;
