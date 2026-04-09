import { getKysely } from '../../db/database.ts';

import { asMonographPublicationManifestationAdminRead } from '../../dtl/monograph/monograph-publication-manifestation-dtl.ts';
import { asMonographPublicationExpressionAdminRead } from '../../dtl/monograph/monograph-publication-expression-dtl.ts';

import type { ValidatedMonographPublicationManifestationAdminRead } from '../../dtl/monograph/monograph-publication-manifestation-dtl.ts';

export async function getPublicationExpressions(publicationId: number) {
  const db = getKysely();

  const expressions = await db
    .selectFrom('monograph_publication_expression')
    .selectAll()
    .where('monograph_publication_id', '=', publicationId)
    .execute();

  if (expressions.length === 0) {
    return [];
  }

  const expressionIds = expressions.map(({ id }) => id);
  const manifestations = await getExpressionsManifestations(expressionIds);

  const validatedExpressions = expressions.map((expression) => {
    const expressionManifestations = manifestations[expression.id] ?? [];
    return asMonographPublicationExpressionAdminRead(expression, expressionManifestations);
  });

  return validatedExpressions;
}

export async function getExpressionsManifestations(expressionIds: number[]) {
  const db = getKysely();

  // Sanity check as otherwise 'IN' might fail within SQL
  if (expressionIds.length === 0) {
    return [];
  }

  const manifestations = await db
    .selectFrom('monograph_publication_manifestation')
    .leftJoin(
      'isbn_identifier',
      'isbn_identifier.monograph_publication_manifestation_id',
      'monograph_publication_manifestation.id',
    )
    // TODO: left join for ISMN identifier
    .selectAll('monograph_publication_manifestation')
    .select(['isbn_identifier.identifier as isbn_identifier'])
    .where('monograph_publication_expression_id', 'in', expressionIds)
    .execute();

  // Constructing map is one pass, i.e., O(1) vs. using filter is O(n)
  // Access return value using result[expressionId] to get manifestations belonging to given expression
  return manifestations.reduce((p: Record<number, ValidatedMonographPublicationManifestationAdminRead[]>, n) => {
    const validatedManifestation = asMonographPublicationManifestationAdminRead(n);
    // Here is a free learning opportunity about of modern JS/TS.
    (p[n.monograph_publication_expression_id] ??= []).push(validatedManifestation);
    return p;
  }, {});
}
