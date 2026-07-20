import { getKysely } from '../../db/database.ts';

import { MONOGRAPH_EXPRESSION_TYPES } from '../../constants.ts';
import { ISBN_VALID_GS1, ISBN_VALID_REGISTRATION_GROUPS } from '../../constants/monograph/isbn-constants.ts';

import { getCurrentTime } from '../shared-interface-utils.ts';

import type { Transaction } from 'kysely';
import type { Database } from '../../db/types.ts';
import type { RequestUser } from '../../generic-types.ts';

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

export function validateIsbnIdentifier(isbnIdentifierWithDashes: string): void {
  if (isbnIdentifierWithDashes.length !== 17) {
    throw new Error(
      `ISBN identifier must be exactly 17 characters long with dashes in place. ${isbnIdentifierWithDashes} has ${isbnIdentifierWithDashes.length} characters and thus is not valid.`,
    );
  }

  const [gs1, registration_group, publisher_element, item_element, check_digit, ...rest] =
    isbnIdentifierWithDashes.split('-');

  if (!gs1 || !Object.values(ISBN_VALID_GS1).includes(gs1)) {
    throw new Error(`GS1 ${gs1} is not valid for Finnish ISBN identifier`);
  }

  if (!registration_group || !Object.values(ISBN_VALID_REGISTRATION_GROUPS).includes(registration_group)) {
    throw new Error(`Registration group ${registration_group} is not valid for Finnish ISBN identifier`);
  }

  if (!publisher_element) {
    throw new Error("Publisher element is not defined and it's a required element in ISBN identifier");
  }

  if (publisher_element.length < 1) {
    throw new Error(`Publisher element ${publisher_element} is too short for ISBN identifier (minimum length: 1)`);
  }

  if (publisher_element.length > 5) {
    throw new Error(
      `Publisher element ${publisher_element} is too long for Finnish ISBN identifier (maximum length: 5)`,
    );
  }

  if (!/^[0-9]{1,5}$/.test(publisher_element)) {
    throw new Error(
      `Publisher element ${publisher_element} cannot contain other characters than numbers in ISBN identifier`,
    );
  }

  if (!item_element) {
    throw new Error("Item element is not defined and it's a required element in ISBN identifier");
  }

  if (item_element.length < 1) {
    throw new Error(`Item element ${item_element} is too short for ISBN identifier (minimum length: 1)`);
  }

  if (item_element.length > 5) {
    throw new Error(`Item element ${item_element} is too long for ISBN identifier (maximum length: 5)`);
  }

  const identifierWithoutCheckDigit = `${gs1}${registration_group}${publisher_element}${item_element}`;
  if (identifierWithoutCheckDigit.length !== 12) {
    throw new Error(
      `ISBN identifier without dashes and check digit must be exactly 12 characters long. ${identifierWithoutCheckDigit} has length of ${identifierWithoutCheckDigit.length}`,
    );
  }

  if (!/^[0-9]{12}$/.test(identifierWithoutCheckDigit)) {
    throw new Error(
      `ISBN identifier without dashes may only contain numbers. String ${identifierWithoutCheckDigit} did not satisfy the requirement.`,
    );
  }

  if (!check_digit) {
    throw new Error("Item check digit is not defined and it's a required element in ISBN identifier");
  }

  if (rest.length !== 0) {
    throw new Error(
      `Given string ${isbnIdentifierWithDashes} contains elements that are undefined for ISBN identifier (${JSON.stringify(rest)}).`,
    );
  }

  if (!/^[0-9]{1}$/.test(check_digit) || isNaN(Number(check_digit))) {
    throw new Error(`Item check digit ${check_digit} must be a number`);
  }

  const weightedSum = identifierWithoutCheckDigit.split('').reduce((acc, char, i) => {
    if (i % 2 === 0) {
      acc += Number(char) * 1;
    } else {
      acc += Number(char) * 3;
    }
    return acc;
  }, 0);

  // Process split per description in ISBN manual
  const sumRemainder = weightedSum % 10;
  const confirmedCheckDigit = sumRemainder === 0 ? 0 : 10 - sumRemainder;

  if (confirmedCheckDigit !== Number(check_digit)) {
    throw new Error(
      `Item check digit ${check_digit} does not satisfy the condition determined for it in ISBN manual (expected ${confirmedCheckDigit})`,
    );
  }
}
