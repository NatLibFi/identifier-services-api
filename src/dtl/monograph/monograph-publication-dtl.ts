import type { MonographPublicationSelect } from '../../db/types/monograph/types-monograph-publication.ts';
import type { MonographPublicationExpressionAdminRead } from './monograph-publication-expression-dtl.ts';

export interface MonographPublicationAdminRead extends MonographPublicationSelect {
  expressions: MonographPublicationExpressionAdminRead[];
}

export function asMonographPublicationAdminRead(
  monographPublication: MonographPublicationSelect,
  expressions: MonographPublicationExpressionAdminRead[],
): MonographPublicationAdminRead {
  const { id, monograph_publisher_id, primary_title, created, created_by, modified, modified_by } =
    monographPublication;

  return {
    id,
    monograph_publisher_id,
    primary_title,
    expressions,
    created,
    created_by,
    modified,
    modified_by,
  };
}
