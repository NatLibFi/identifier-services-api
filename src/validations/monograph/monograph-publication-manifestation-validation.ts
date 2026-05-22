import * as z from 'zod';
import { monographManifestationTypeEnum } from '../common-validation-enum.ts';
import { issnLikeString, monthString, yearString } from '../common-validation-regex.ts';
import { MONOGRAPH_MANIFESTATION_TYPES_ELECTRONICAL, MONOGRAPH_MANIFESTATION_TYPES_PRINT } from '../../constants.ts';
import { getCurrentTime } from '../../interfaces/interface-utils/common-interface-utils.ts';

const monographPublicationManifestationSeriesSchema = z
  .object({
    name: z.string().max(200).nullable(),
    issn: z.string().regex(issnLikeString).nullable(),
    volume: z.string().max(20).nullable(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (!data.name && !data.issn) {
      ctx.addIssue({
        path: ['name'],
        code: 'custom',
        message: 'Either series name or ISSN needs to be defined',
      });
    }
  });

const monographPublicationManifestationPrintingInformationSchema = z
  .object({
    printing_house: z.string().max(100),
    printing_house_city: z.string().max(50).nullable(),
    copies: z.string().max(10).nullable(),
  })
  .strict();

export const createMonographPublicationManifestationSchema = z
  .object({
    monograph_publication_expression_id: z.number().optional(), // Used when adding new manifestation to existing expression. Should not be defined when creating a new request.
    monograph_publication_request_id: z.number().optional(), // Used when adding new manifestation to existing request.
    manifestation_type: z.enum(monographManifestationTypeEnum),
    manifestation_type_other: z.string().max(100).optional().nullable(),
    publication_year: z.string().min(4).max(4).regex(yearString),
    publication_month: z.string().min(2).max(2).regex(monthString),
    series: z.array(monographPublicationManifestationSeriesSchema).max(5),
    printing_information: z.array(monographPublicationManifestationPrintingInformationSchema).max(10),
    manifestation_edition: z
      .string()
      .max(2)
      .regex(/^([0-9]{1}$|^[1-9]{1}[0-9]{1})?$/)
      .optional()
      .nullable(),
  })
  .strict()
  .superRefine((data, ctx) => {
    // Require type other definition if type is one of ambiguous types
    const needTypeOther = [
      MONOGRAPH_MANIFESTATION_TYPES_PRINT.OTHER_PRINT,
      MONOGRAPH_MANIFESTATION_TYPES_ELECTRONICAL.OTHER,
    ].includes(data.manifestation_type);
    if (needTypeOther && !data.manifestation_type_other) {
      ctx.addIssue({
        path: ['manifestation_type_other'],
        code: 'custom',
        message: 'Additional type definition is required for manifestations having type of OTHER or OTHER_PRINT',
      });
    }

    // Publishing date validation
    const currentDate = getCurrentTime();
    const publishedDuringCurrentYear = data.publication_year === String(currentDate.getFullYear());
    const publicationMonth = Number(data.publication_month.replace(/^0/, '')); // Transform zero-padded string to number

    const publishedInPreviousYear = Number(data.publication_year) < currentDate.getFullYear();
    const publishedInPreviousMonthCurrentYear =
      publishedDuringCurrentYear && publicationMonth < currentDate.getMonth() + 1;

    // This is a sanity check regarding the process: ISBN/ISMN cannot be assigned to already published item
    if (publishedInPreviousYear) {
      ctx.addIssue({
        path: ['publication_year'],
        code: 'custom',
        message: 'Cannot add manifestationthat has already been published',
      });
    }

    if (publishedInPreviousMonthCurrentYear) {
      ctx.addIssue({
        path: ['publication_month'],
        code: 'custom',
        message: 'Cannot add manifestationthat has already been published',
      });
    }
  });

export const addMonographPublicationManifestationSchema = createMonographPublicationManifestationSchema.superRefine(
  (data, ctx) => {
    // Add constraint for monograph_publication_expression_id
    if (!data.monograph_publication_expression_id) {
      ctx.addIssue({
        path: ['monograph_publication_expression_id'],
        code: 'custom',
        message: 'Defining monograph_publication_expression_id is mandatory',
      });
    }

    // Add constraint for monograph_publication_request_id -> manifestations added using add-endpoint should not be connected to a form
    if (data.monograph_publication_request_id) {
      ctx.addIssue({
        path: ['monograph_publication_request_id'],
        code: 'custom',
        message:
          'Defining monograph_publication_request_id is forbidden when adding new manifestation to existing expression',
      });
    }
  },
);

export const updateMonographPublicationManifestationSchema = z
  .object({
    cancelled: z.boolean().optional(),
    manifestation_type: z.enum(monographManifestationTypeEnum).optional(),
    manifestation_type_other: z.string().max(100).optional().nullable(),
    publication_year: z.string().min(4).max(4).regex(yearString).optional(),
    publication_month: z.string().min(2).max(2).regex(monthString).optional(),
    series: z.array(monographPublicationManifestationSeriesSchema).max(5).optional(),
    printing_information: z.array(monographPublicationManifestationPrintingInformationSchema).max(10).optional(),
    manifestation_edition: z
      .string()
      .max(2)
      .regex(/^([0-9]{1}$|^[1-9]{1}[0-9]{1})?$/)
      .optional()
      .nullable(),
  })
  .strict()
  .superRefine((data, ctx) => {
    // Require type other definition if type is one of ambiguous types
    if (data.manifestation_type) {
      const needTypeOther = [
        MONOGRAPH_MANIFESTATION_TYPES_PRINT.OTHER_PRINT,
        MONOGRAPH_MANIFESTATION_TYPES_ELECTRONICAL.OTHER,
      ].includes(data.manifestation_type);

      if (needTypeOther && !data.manifestation_type_other) {
        ctx.addIssue({
          path: ['manifestation_type_other'],
          code: 'custom',
          message: 'Additional type definition is required for manifestations having type of OTHER or OTHER_PRINT',
        });
      }
    }

    // Publishing date validation done within interface as only year or month may be updated
  });

export type CreateMonographPublicationManifestation = z.infer<typeof createMonographPublicationManifestationSchema>;
export type UpdateMonographPublicationManifestation = z.infer<typeof updateMonographPublicationManifestationSchema>;
export type AddMonographPublicationManifestation = z.infer<typeof addMonographPublicationManifestationSchema>;
