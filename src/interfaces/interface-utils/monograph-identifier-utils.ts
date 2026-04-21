import type { Transaction } from 'kysely';

import { getKysely } from '../../db/database.ts';

import { getCurrentTime, validateGetById } from './common-interface-utils.ts';

import { MONOGRAPH_EXPRESSION_TYPES, MONOGRAPH_IDENTIFIERS } from '../../constants.ts';

import type { Database } from '../../db/types.ts';
import type { RequestUser } from '../../generic-types.ts';
import type { MonographPublicationExpressionSelect } from '../../db/types/monograph/types-monograph-publication-expression.ts';

export function calculateIsbn13CheckDigit(identifierWithoutDashes: string) {
  const containsTwelveDigits = identifierWithoutDashes.match(/^\d{12}$/);
  if (!containsTwelveDigits) {
    throw new Error('ISBN-13 check digit may be only calculated for input that contains exactly 12 digits');
  }

  // Converted to JavaScript from original ID registry PHP implementation.
  // Original source: https://github.com/petkivim/id-registry/blob/cab34a3ec83ef478bad8d6cc0edcbabc1be02a64/src/monograph-publishers/com_isbnregistry/admin/helpers/publisherisbnrange.php#L45
  const sum = identifierWithoutDashes.split('').reduce((acc, char, i) => {
    if (i % 2 === 0) {
      acc += Number(char) * 1;
    } else {
      acc += Number(char) * 3;
    }
    return acc;
  }, 0);

  return `${(10 - (sum % 10)) % 10}`;
}

export async function assignIsbnIdentifier(
  manifestationId: number,
  identifierString: string,
  trx: Transaction<Database>,
  user: RequestUser,
) {
  const db = getKysely();
  const isbnIdentifier = await db
    .selectFrom('isbn_identifier')
    .leftJoin('isbn_publisher_range', 'isbn_publisher_range.id', 'isbn_identifier.isbn_publisher_range_id')
    .selectAll('isbn_identifier')
    .select('isbn_publisher_range.monograph_publisher_id as monograph_publisher_id')
    .where('isbn_identifier.identifier', '=', identifierString)
    .executeTakeFirstOrThrow();

  // Sanity check: monograph publisher id must exist for identifier
  if (!isbnIdentifier.monograph_publisher_id) {
    throw new Error(
      `Monograph publisher was not defined for ISBN identifier ${identifierString} (id ${isbnIdentifier.id})`,
      { cause: 'ISBN does not belong to given publisher' },
    );
  }

  // Sanity check identifier publisher range belongs to manifestation expression publication
  const manifestation = await db
    .selectFrom('monograph_publication_manifestation')
    .leftJoin(
      'monograph_publication_expression',
      'monograph_publication_expression.id',
      'monograph_publication_manifestation.monograph_publication_expression_id',
    )
    .leftJoin(
      'monograph_publication',
      'monograph_publication.id',
      'monograph_publication_expression.monograph_publication_id',
    )
    .select(['monograph_publication_manifestation.id', 'monograph_publication_manifestation.cancelled'])
    .select('monograph_publication.monograph_publisher_id as monograph_publisher_id')
    .select('monograph_publication_expression.expression_type as expression_type')
    .where('monograph_publication_manifestation.id', '=', manifestationId)
    .executeTakeFirstOrThrow();

  // Sanity check: monograph publisher id must exist for manifestation
  if (!manifestation.monograph_publisher_id) {
    throw new Error(`Monograph publisher was not defined for manifestation id ${manifestationId}`, {
      cause: 'Manifestation is missing publisher definition',
    });
  }

  // Sanity check: monograph_publisher_id is same for manifestation and ISBN identifier
  if (manifestation.monograph_publisher_id !== isbnIdentifier.monograph_publisher_id) {
    throw new Error(
      `Cannot allocate manifestation id ${manifestationId} ISBN identifier id ${identifierString} because it does not belong the monograph publisher that the manifestation belongs to`,
      { cause: 'Mismatching publisher between ISBN identifier and manifestation' },
    );
  }

  // Sanity check: cannot assign identifier that has already been assigned
  if (isbnIdentifier.monograph_publication_manifestation_id !== null) {
    throw new Error(
      `Cannot allocate manifestation id ${manifestationId} ISBN identifier ${identifierString} because the identifier has been used by manifestation id ${isbnIdentifier.monograph_publication_manifestation_id}`,
      { cause: 'ISBN already assigned' },
    );
  }

  // Important note for future implementations: ISMN identifier assignment check is skipped because expression type check should exist in both ISBN and ISMN assignation functions
  // In case this type of mechanism is not implemented, it will be possible to assign both ISBN and ISMN for same manifestation. This should not ever happen, so please take care when re-implementing.

  // Sanity check: cannot assign ISBN identifier for manifestation that is associated with expression having type of SHEET_MUSIC
  // Verification is however made as include check because this emphasizes on type of data integrity that we wish for
  const allowedExpressionTypes = [
    MONOGRAPH_EXPRESSION_TYPES.BOOK,
    MONOGRAPH_EXPRESSION_TYPES.DISSERTATION,
    MONOGRAPH_EXPRESSION_TYPES.MAP,
    MONOGRAPH_EXPRESSION_TYPES.OTHER,
  ];

  if (!manifestation.expression_type || !allowedExpressionTypes.includes(manifestation.expression_type)) {
    throw new Error(
      `Cannot allocate manifestation id ${manifestationId} ISBN identifier ${identifierString} because the expression manifestation is attached to has invalid type for ISBN (${manifestation.expression_type})`,
      { cause: 'Expression type disallows ISBN for manifestation' },
    );
  }

  // Assign identifier and verify result
  const assignResult = await trx
    .updateTable('isbn_identifier')
    .set({
      monograph_publication_manifestation_id: manifestationId,
      modified: getCurrentTime(),
      modified_by: user.id,
    })
    .where('id', '=', isbnIdentifier.id)
    .executeTakeFirstOrThrow();

  if (Number(assignResult.numUpdatedRows) !== 1) {
    throw new Error('Unexpected number of rows would have been updated. Throw error to initialize rollback.');
  }

  return;
}

export async function deassignIsbnIdentifier(manifestationId: number, trx: Transaction<Database>, user: RequestUser) {
  const assignResult = await trx
    .updateTable('isbn_identifier')
    .set({
      monograph_publication_manifestation_id: null,
      modified: getCurrentTime(),
      modified_by: user.id,
    })
    .where('monograph_publication_manifestation_id', '=', manifestationId)
    .executeTakeFirstOrThrow();

  if (Number(assignResult.numUpdatedRows) !== 1) {
    throw new Error('Unexpected number of rows would have been updated. Throw error to initialize rollback.');
  }

  return;
}

export async function getAssignableIsbnIdentifiers(monographPublisherId: number, numberOfIdentifiers: number) {
  const db = getKysely();
  const isbnIdentifiers = await db
    .selectFrom('isbn_identifier')
    .leftJoin('isbn_publisher_range', 'isbn_publisher_range.id', 'isbn_identifier.isbn_publisher_range_id')
    .selectAll('isbn_identifier')
    .select('isbn_publisher_range.monograph_publisher_id as monograph_publisher_id')
    .where('monograph_publisher_id', '=', monographPublisherId)
    .where('isbn_identifier.monograph_publication_manifestation_id', 'is', null)
    .orderBy('isbn_identifier.isbn_publisher_range_id', 'asc')
    .orderBy('isbn_identifier.identifier', 'asc')
    .limit(numberOfIdentifiers)
    .execute();

  if (isbnIdentifiers.length < numberOfIdentifiers) {
    throw new Error(
      `Could not provide as many ISBN identifiers that were asked. Only ${isbnIdentifiers.length} are available for the publisher to assign currently.`,
      { cause: 'Inadequate number of identifiers' },
    );
  }

  return isbnIdentifiers.map(({ identifier }) => identifier);
}

export async function getAssignableIsbnIdentifier(manifestationId: number) {
  const db = getKysely();
  const manifestation = await db
    .selectFrom('monograph_publication_manifestation')
    .leftJoin(
      'monograph_publication_expression',
      'monograph_publication_expression.id',
      'monograph_publication_manifestation.monograph_publication_expression_id',
    )
    .leftJoin(
      'monograph_publication',
      'monograph_publication.id',
      'monograph_publication_expression.monograph_publication_id',
    )
    .select(['monograph_publication_manifestation.id', 'monograph_publication_manifestation.cancelled'])
    .select('monograph_publication.monograph_publisher_id as monograph_publisher_id')
    .where('monograph_publication_manifestation.id', '=', manifestationId)
    .executeTakeFirstOrThrow();

  // Sanity check: monograph publisher id must exist for manifestation
  if (!manifestation.monograph_publisher_id) {
    throw new Error(`Monograph publisher was not defined for manifestation id ${manifestationId}`, {
      cause: 'No publisher defined',
    });
  }

  const [isbnIdentifier] = await db
    .selectFrom('isbn_identifier')
    .leftJoin('isbn_publisher_range', 'isbn_publisher_range.id', 'isbn_identifier.isbn_publisher_range_id')
    .select(['isbn_identifier.id', 'isbn_identifier.isbn_publisher_range_id', 'isbn_identifier.identifier'])
    .select('isbn_publisher_range.monograph_publisher_id as monograph_publisher_id')
    .where('monograph_publisher_id', '=', manifestation.monograph_publisher_id)
    .where('isbn_identifier.monograph_publication_manifestation_id', 'is', null)
    .orderBy('isbn_identifier.isbn_publisher_range_id', 'asc')
    .orderBy('isbn_identifier.identifier', 'asc')
    .limit(1)
    .execute();

  if (!isbnIdentifier) {
    throw new Error(
      'Could not provide ISBN identifier for manifestation as no ISBN identifiers are available for the given publisher to assign currently.',
      { cause: 'Inadequate number of identifiers' },
    );
  }

  return isbnIdentifier.identifier;
}

export async function getExpressionIdentifierType(expressionId: number) {
  const db = getKysely();

  const expression = await db
    .selectFrom('monograph_publication_expression')
    .selectAll()
    .where('id', '=', expressionId)
    .execute();

  const validatedExpression = validateGetById<MonographPublicationExpressionSelect>(expression);

  const ismnExpressionTypes = [MONOGRAPH_EXPRESSION_TYPES.SHEET_MUSIC];
  if (ismnExpressionTypes.includes(validatedExpression.expression_type)) {
    return MONOGRAPH_IDENTIFIERS.ISMN;
  }

  const isbnExpressionTypes = [
    MONOGRAPH_EXPRESSION_TYPES.BOOK,
    MONOGRAPH_EXPRESSION_TYPES.DISSERTATION,
    MONOGRAPH_EXPRESSION_TYPES.MAP,
    MONOGRAPH_EXPRESSION_TYPES.OTHER,
  ];
  if (isbnExpressionTypes.includes(validatedExpression.expression_type)) {
    return MONOGRAPH_IDENTIFIERS.ISBN;
  }

  throw new Error(`Unsupported monograph identifier type observed for expression id ${expressionId}`);
}
