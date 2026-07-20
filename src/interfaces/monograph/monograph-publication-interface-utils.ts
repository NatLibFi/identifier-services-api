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
    const expressionManifestations = manifestations[expression.id];

    if (expressionManifestations === undefined) {
      return asMonographPublicationExpressionAdminRead(expression, []);
    }

    return asMonographPublicationExpressionAdminRead(expression, expressionManifestations);
  });

  return validatedExpressions;
}

// Note: returns manifestations for given expressionIds in format where object key is expressionId and value is array of manifestations
// E.g. for expression id 91 the object has key -> {"91": [{"id": 1, "manifestation_type": ...}]}
export async function getExpressionsManifestations(
  expressionIds: number[],
): Promise<Record<string, ValidatedMonographPublicationManifestationAdminRead[]>> {
  const db = getKysely();

  // Sanity check as otherwise 'IN' might fail within SQL
  if (expressionIds.length === 0) {
    return {};
  }

  const manifestations = await db
    .selectFrom('monograph_publication_manifestation')
    .leftJoin(
      'isbn_identifier',
      'isbn_identifier.monograph_publication_manifestation_id',
      'monograph_publication_manifestation.id',
    )
    .leftJoin(
      'ismn_identifier',
      'ismn_identifier.monograph_publication_manifestation_id',
      'monograph_publication_manifestation.id',
    )
    .selectAll('monograph_publication_manifestation')
    .select(['isbn_identifier.identifier as isbn_identifier', 'isbn_identifier.modified as isbn_identifier_assigned'])
    .select(['ismn_identifier.identifier as ismn_identifier', 'ismn_identifier.modified as ismn_identifier_assigned'])
    .where('monograph_publication_expression_id', 'in', expressionIds)
    .execute();

  // Access return value using result[expressionId] to get manifestations belonging to given expression
  const result: Record<string, ValidatedMonographPublicationManifestationAdminRead[]> = {};

  for (const manifestation of manifestations) {
    const associatedMessages = await db
      .selectFrom('monograph_message_publication_manifestation')
      .select(db.fn.countAll<number>().as('num_messages'))
      .where('monograph_publication_manifestation_id', '=', manifestation.id)
      .executeTakeFirstOrThrow();
    const hasMessage = associatedMessages.num_messages > 0;
    const validatedManifestation = asMonographPublicationManifestationAdminRead(manifestation, hasMessage);

    // Learning opportunity regarding modern JS/TS
    (result[`${manifestation.monograph_publication_expression_id}`] ??= []).push(validatedManifestation);
  }

  return result;
}
