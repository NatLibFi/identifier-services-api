import * as z from 'zod';

import {
  monographAuthorRoleEnum,
  monographExpressionTypeEnum,
  publicationLanguageEnum,
} from '../common-validation-enum.ts';

import { createMonographPublicationManifestationSchema } from './monograph-publication-manifestation-validation.ts';

const monographPublicationExpressionAuthorSchema = z
  .object({
    first_name: z.string().min(1).max(50),
    last_name: z.string().min(1).max(50),
    isni: z.string().min(16).max(16).nullable(),
    roles: z.array(z.enum(monographAuthorRoleEnum)).min(1).max(4),
  })
  .strict();

export const createMonographPublicationExpressionSchema = z
  .object({
    expression_type: z.enum(monographExpressionTypeEnum),
    expression_language: z.enum(publicationLanguageEnum),
    authors: z.array(monographPublicationExpressionAuthorSchema).min(1).max(8),
    title: z.string().min(1).max(200),
    subtitle: z.string().max(200).optional().nullable(),
    map_scale: z.string().max(50).optional().nullable(),
    manifestations: z.array(createMonographPublicationManifestationSchema).min(1).max(10),
  })
  .strict();

export const addMonographPublicationExpressionSchema = z.intersection(
  createMonographPublicationExpressionSchema,
  z
    .object({
      monograph_publication_id: z.number(),
    })
    .strict(),
);

export const updateMonographPublicationExpressionSchema = z
  .object({
    expression_type: z.enum(monographExpressionTypeEnum).optional(),
    expression_language: z.enum(publicationLanguageEnum).optional(),
    authors: z.array(monographPublicationExpressionAuthorSchema).min(1).max(8).optional(),
    title: z.string().min(1).max(200).optional(),
    subtitle: z.string().max(200).optional().nullable(),
    map_scale: z.string().max(50).optional().nullable(),
  })
  .strict();

export type CreateMonographPublicationExpression = z.infer<typeof createMonographPublicationExpressionSchema>;
export type AddMonographPublicationExpression = z.infer<typeof addMonographPublicationExpressionSchema>;
export type UpdateMonographPublicationExpression = z.infer<typeof updateMonographPublicationExpressionSchema>;
