import type { MonographPublicationExpressionSelect } from '../../db/types/monograph/types-monograph-publication-expression.ts';
import type { ValidatedMonographPublicationManifestationAdminRead } from './monograph-publication-manifestation-dtl.ts';

export interface MonographPublicationExpressionAdminRead extends MonographPublicationExpressionSelect {
  manifestations: ValidatedMonographPublicationManifestationAdminRead[];
}

export function asMonographPublicationExpressionAdminRead(
  expression: MonographPublicationExpressionSelect,
  manifestations: ValidatedMonographPublicationManifestationAdminRead[],
): MonographPublicationExpressionAdminRead {
  const {
    id,
    monograph_publication_id,
    expression_type,
    expression_language,
    title,
    subtitle,
    map_scale,
    authors,
    created,
    created_by,
    modified,
    modified_by,
  } = expression;

  return {
    id,
    monograph_publication_id,
    expression_type,
    expression_language,
    title,
    subtitle,
    map_scale,
    authors,
    manifestations,
    created,
    created_by,
    modified,
    modified_by,
  };
}
