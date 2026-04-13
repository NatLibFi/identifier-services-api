import * as z from 'zod';

import {
  langCodeEnum,
  monographExpressionTypeEnum,
  monographManifestationTypeElectronicalEnum,
  monographManifestationTypePrintEnum,
  monographPublicationRequestStateEnum,
  monographPublishingActivityEnum,
  publicationLanguageEnum,
} from '../common-validation-enum.ts';
import { issnLikeString, monthString, numbersOnlyString, yearString } from '../common-validation-regex.ts';
import {
  MONOGRAPH_EXPRESSION_TYPES,
  MONOGRAPH_MANIFESTATION_TYPES_ELECTRONICAL,
  MONOGRAPH_MANIFESTATION_TYPES_PRINT,
} from '../../constants.ts';
import { getCurrentTime } from '../../interfaces/interface-utils/common-interface-utils.ts';

import { createMonographPublicationExpressionSchema } from './monograph-publication-expression-validation.ts';

export const createMonographPublicationRequestV1Schema = z
  .object({
    version: z.literal(1), // This schema must explicitly define use of v1
    officialName: z.string().min(1).max(100),
    publisherIdentifierStr: z.string().max(20).optional(),
    locality: z.enum(['Helsinki']).optional(),
    contactPerson: z.string().min(1).max(100),
    address: z.string().min(1).max(50).optional(), // Contact information is optional for Admin UI purposes
    zip: z
      .string()
      .min(5)
      .max(5)
      .regex(/^[0-9]{5}$/, 'forms.errors.common.zip-format')
      .optional(),
    city: z.string().min(1).max(50).optional(),
    phone: z
      .string()
      .min(4)
      .max(30)
      .regex(/^[0-9+-\s]{4,30}$/, 'forms.errors.common.phone-format')
      .optional(),
    email: z.email().optional(),
    langCode: z.enum(langCodeEnum),
    publishedBefore: z.boolean(),
    publicationsPublic: z.literal(true),
    publishingActivity: z.enum(monographPublishingActivityEnum),
    publishingActivityAmount: z
      .string()
      .max(5)
      .regex(/^([0-9-]+)?$/),
    publicationType: z.enum(monographExpressionTypeEnum),
    publicationFormat: z.enum(['PRINT', 'ELECTRONICAL', 'PRINT_ELECTRONICAL']).optional(), // Deprecated and thus not in constants
    firstName1: z.string().min(1).max(50),
    lastName1: z.string().min(1).max(50),
    role1: z.array(z.string()).min(1).max(4),
    firstName2: z.string().max(50).optional(),
    lastName2: z.string().max(50).optional(),
    role2: z.array(z.string()).max(4).optional(),
    firstName3: z.string().max(50).optional(),
    lastName3: z.string().max(50).optional(),
    role3: z.array(z.string()).max(4).optional(),
    firstName4: z.string().max(50).optional(),
    lastName4: z.string().max(50).optional(),
    role4: z.array(z.string()).max(4).optional(),
    title: z.string().min(1).max(200),
    subtitle: z.string().max(200).optional(),
    mapScale: z.string().max(50).optional(),
    language: z.enum(publicationLanguageEnum),
    year: z.string().min(4).max(4).regex(yearString),
    month: z.string().min(2).max(2).regex(monthString),
    series: z.string().max(200).optional(),
    issn: z.string().regex(issnLikeString).optional(),
    volume: z.string().max(20).optional(),
    printingHouse: z.string().max(100).optional(),
    printingHouseCity: z.string().max(50).optional(),
    copies: z.string().max(10).regex(numbersOnlyString).optional(),
    edition: z
      .string()
      .max(2)
      .regex(/^([0-9]{1}$|^[1-9]{1}[0-9]{1})?$/)
      .optional(),
    type: z.array(z.enum(monographManifestationTypePrintEnum)).max(4).optional(),
    typeOther: z.string().max(100).optional(),
    comments: z.string().max(2000).optional(),
    fileformat: z.array(z.enum(monographManifestationTypeElectronicalEnum)).max(4).optional(),
    fileformatOther: z.string().max(100).optional(),
  })
  .superRefine((data, ctx) => {
    // Locality validation for dissertations
    const isDissertation = data.publicationType === MONOGRAPH_EXPRESSION_TYPES.DISSERTATION;

    // For dissertations locality is mandatory
    if (isDissertation && !data.locality) {
      ctx.addIssue({
        path: ['locality'],
        code: 'custom',
        message: 'Locality is required for dissertations',
      });
    }

    // Publishing date validation
    const currentDate = getCurrentTime();
    const publishedDuringCurrentYear = data.year === String(currentDate.getFullYear());
    const publicationMonth = Number(data.month.replace(/^0/, '')); // Transform zero-padded string to number

    const publishedInPreviousYear = Number(data.year) < currentDate.getFullYear();
    const publishedInPreviousMonthCurrentYear =
      publishedDuringCurrentYear && publicationMonth < currentDate.getMonth() + 1;

    // This is a sanity check regarding the process: ISBN/ISMN cannot be assigned to already published item
    if (publishedInPreviousYear) {
      ctx.addIssue({
        path: ['year'],
        code: 'custom',
        message: 'Cannot request ISBN/ISMN for already published item',
      });
    }

    if (publishedInPreviousMonthCurrentYear) {
      ctx.addIssue({
        path: ['month'],
        code: 'custom',
        message: 'Cannot request ISBN/ISMN for already published item',
      });
    }

    // typeOther validation if PRINT_OTHER selected as type
    const hasPrintOther = data.type?.includes(MONOGRAPH_MANIFESTATION_TYPES_PRINT.OTHER_PRINT);
    if (hasPrintOther && !data.typeOther) {
      ctx.addIssue({
        path: ['typeOther'],
        code: 'custom',
        message: 'Publication cannot have type of other (print) without having further definition in typeOther',
      });
    }

    // fileformatOther validation if OTHER selected as fileformat
    const hasFileformatOther = data.fileformat?.includes(MONOGRAPH_MANIFESTATION_TYPES_ELECTRONICAL.OTHER);
    if (hasFileformatOther && !data.fileformatOther) {
      ctx.addIssue({
        path: ['fileformatOther'],
        code: 'custom',
        message:
          'Publication cannot have type of other (electronical) without having further definition in fileformatOther',
      });
    }

    // Require email or phone
    if (!data.email && !data.phone) {
      ctx.addIssue({
        path: ['email'],
        code: 'custom',
        message: 'Having email or phone as contact information is mandatory',
      });
    }

    // Either type or fileformat needs to be defined (i.e., one manifestation type)
    if (!data.fileformat && !data.type) {
      ctx.addIssue({
        path: ['type'],
        code: 'custom',
        message: 'Either type or fileformat is required to be defined',
      });
    }
  });

const monographPublicationRequestSchema = z
  .object({
    official_name: z.string().min(1).max(100),
    publisher_identifier_str: z.string().max(20).optional().nullable(),
    locality: z.enum(['Helsinki']).optional().nullable(),
    contact_person: z.string().min(1).max(100),
    address: z.string().min(1).max(50).optional().nullable(), // Contact information is optional for Admin UI purposes
    zip: z
      .string()
      .regex(/^[0-9]{5}$/, 'forms.errors.common.zip-format')
      .optional()
      .nullable(),
    city: z.string().min(1).max(50).optional().nullable(),
    phone: z
      .string()
      .regex(/^[0-9+-\s]{4,30}$/, 'forms.errors.common.phone-format')
      .optional()
      .nullable(),
    email: z.email().optional().nullable(),
    lang_code: z.enum(langCodeEnum),
    published_before: z.boolean(),
    publications_public: z.literal(true),
    publishing_activity: z.enum(monographPublishingActivityEnum),
    publishing_activity_amount: z
      .string()
      .max(5)
      .regex(/^([0-9-]+)?$/),
    comments: z.string().max(2000).optional().nullable(),
  })
  .strict()
  .superRefine((data, ctx) => {
    // Require email or phone as request contact
    if (!data.email && !data.phone) {
      ctx.addIssue({
        path: ['email'],
        code: 'custom',
        message: 'Having email or phone as contact information is mandatory',
      });
    }
  });

export const createMonographPublicationRequestV2Schema = z
  .object({
    version: z.literal(2), // This schema must explicitly define use of v2
    request: monographPublicationRequestSchema,
    expressions: z.array(createMonographPublicationExpressionSchema).min(1).max(5),
  })
  .strict()
  .superRefine((data, ctx) => {
    // Locality is also mandatory for dissertations
    const isDissertation = data.expressions.some((e) => e.expression_type === MONOGRAPH_EXPRESSION_TYPES.DISSERTATION);
    if (isDissertation && !data.request.locality) {
      ctx.addIssue({
        path: ['locality'],
        code: 'custom',
        message: 'Locality is mandatory for dissertations',
      });
    }

    // Locality should also be defined only for dissertations
    if (!isDissertation && !!data.request.locality) {
      ctx.addIssue({
        path: ['locality'],
        code: 'custom',
        message: 'Locality cannot be defined if expressions consider dissertation',
      });
    }
  });

export const searchMonographPublicationRequestSchema = z
  .object({
    search_text: z.string().max(100).optional(),
    request_state: z.enum(monographPublicationRequestStateEnum).optional().nullable(),
    limit: z.number().min(1).max(50),
    offset: z.number().min(0).max(100000),
  })
  .strict();

// Use discriminated union on "version" attribute to validate request against the desired version
export const createMonographPublicationRequestSchema = z.discriminatedUnion('version', [
  createMonographPublicationRequestV1Schema,
  createMonographPublicationRequestV2Schema,
]);

export type CreateMonographPublicationRequestV1Http = z.infer<typeof createMonographPublicationRequestV1Schema>;
export type CreateMonographPublicationRequestV2Http = z.infer<typeof createMonographPublicationRequestV2Schema>;

export type SearchMonographPublicationRequestHttp = z.infer<typeof searchMonographPublicationRequestSchema>;
