import { getKysely } from '../../db/database.ts';

import { MONOGRAPH_EXPRESSION_TYPES } from '../../constants.ts';
import { ISMN_VALID_GS1, ISMN_VALID_REGISTRATION_GROUPS } from '../../constants/monograph/ismn-constants.ts';

import { getCurrentTime } from '../shared-interface-utils.ts';

import type { Transaction } from 'kysely';
import type { Database } from '../../db/types.ts';
import type { RequestUser } from '../../generic-types.ts';

export async function getAssignableIsmnIdentifiers(monographPublisherId: number, numberOfIdentifiers: number) {
  const db = getKysely();
  const ismnIdentifiers = await db
    .selectFrom('ismn_identifier')
    .leftJoin('ismn_publisher_range', 'ismn_publisher_range.id', 'ismn_identifier.ismn_publisher_range_id')
    .selectAll('ismn_identifier')
    .select('ismn_publisher_range.monograph_publisher_id as monograph_publisher_id')
    .where('monograph_publisher_id', '=', monographPublisherId)
    .where('ismn_identifier.monograph_publication_manifestation_id', 'is', null)
    .where('ismn_identifier.monograph_identifier_batch_id', 'is', null)
    .orderBy('ismn_identifier.ismn_publisher_range_id', 'asc')
    .orderBy('ismn_identifier.identifier', 'asc')
    .limit(numberOfIdentifiers)
    .execute();

  if (ismnIdentifiers.length < numberOfIdentifiers) {
    throw new Error(
      `Could not provide as many ISMN identifiers that were asked. Only ${ismnIdentifiers.length} are available for the publisher to assign currently.`,
      { cause: 'Inadequate number of identifiers' },
    );
  }

  return ismnIdentifiers.map(({ identifier }) => identifier);
}

export async function getAssignableIsmnIdentifier(manifestationId: number) {
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

  const [ismnIdentifier] = await db
    .selectFrom('ismn_identifier')
    .leftJoin('ismn_publisher_range', 'ismn_publisher_range.id', 'ismn_identifier.ismn_publisher_range_id')
    .select(['ismn_identifier.id', 'ismn_identifier.ismn_publisher_range_id', 'ismn_identifier.identifier'])
    .select('ismn_publisher_range.monograph_publisher_id as monograph_publisher_id')
    .where('monograph_publisher_id', '=', manifestation.monograph_publisher_id)
    .where('ismn_identifier.monograph_publication_manifestation_id', 'is', null)
    .where('ismn_identifier.monograph_identifier_batch_id', 'is', null)
    .orderBy('ismn_identifier.ismn_publisher_range_id', 'asc')
    .orderBy('ismn_identifier.identifier', 'asc')
    .limit(1)
    .execute();

  if (!ismnIdentifier) {
    throw new Error(
      'Could not provide ISMN identifier for manifestation as no ISMN identifiers are available for the given publisher to assign currently.',
      { cause: 'Inadequate number of identifiers' },
    );
  }

  return ismnIdentifier.identifier;
}

export async function assignIsmnIdentifier(
  manifestationId: number,
  identifierString: string,
  trx: Transaction<Database>,
  user: RequestUser,
) {
  const db = getKysely();
  const ismnIdentifier = await db
    .selectFrom('ismn_identifier')
    .leftJoin('ismn_publisher_range', 'ismn_publisher_range.id', 'ismn_identifier.ismn_publisher_range_id')
    .selectAll('ismn_identifier')
    .select('ismn_publisher_range.monograph_publisher_id as monograph_publisher_id')
    .where('ismn_identifier.identifier', '=', identifierString)
    .where('ismn_identifier.monograph_publication_manifestation_id', 'is', null)
    .where('ismn_identifier.monograph_identifier_batch_id', 'is', null)
    .executeTakeFirstOrThrow();

  // Sanity check: monograph publisher id must exist for identifier
  if (!ismnIdentifier.monograph_publisher_id) {
    throw new Error(
      `Monograph publisher was not defined for ISMN identifier ${identifierString} (id ${ismnIdentifier.id})`,
      { cause: 'ISMN does not belong to given publisher' },
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

  // Sanity check: monograph_publisher_id is same for manifestation and ISMN identifier
  if (manifestation.monograph_publisher_id !== ismnIdentifier.monograph_publisher_id) {
    throw new Error(
      `Cannot allocate manifestation id ${manifestationId} ISMN identifier id ${identifierString} because it does not belong the monograph publisher that the manifestation belongs to`,
      { cause: 'Mismatching publisher between ISMN identifier and manifestation' },
    );
  }

  // Sanity check: cannot assign identifier that has already been assigned
  if (ismnIdentifier.monograph_publication_manifestation_id !== null) {
    throw new Error(
      `Cannot allocate manifestation id ${manifestationId} ISMN identifier ${identifierString} because the identifier has been used by manifestation id ${ismnIdentifier.monograph_publication_manifestation_id}`,
      { cause: 'ISMN already assigned' },
    );
  }

  // Important note for future implementations: ISMN identifier assignment check is skipped because expression type check should exist in both ISMN and ISMN assignation functions
  // In case this type of mechanism is not implemented, it will be possible to assign both ISBN and ISMN for same manifestation. This should not ever happen, so please take care when re-implementing.

  // Sanity check: cannot assign ISMN identifier for manifestation that is associated with expression having type of SHEET_MUSIC
  // Verification is however made as include check because this emphasizes on type of data integrity that we wish for
  const allowedExpressionTypes = [MONOGRAPH_EXPRESSION_TYPES.SHEET_MUSIC];

  if (!manifestation.expression_type || !allowedExpressionTypes.includes(manifestation.expression_type)) {
    throw new Error(
      `Cannot allocate manifestation id ${manifestationId} ISMN identifier ${identifierString} because the expression manifestation is attached to has invalid type for ISMN (${manifestation.expression_type})`,
      { cause: 'Expression type disallows ISMN for manifestation' },
    );
  }

  // Assign identifier and verify result
  const assignResult = await trx
    .updateTable('ismn_identifier')
    .set({
      monograph_publication_manifestation_id: manifestationId,
      modified: getCurrentTime(),
      modified_by: user.id,
    })
    .where('id', '=', ismnIdentifier.id)
    .executeTakeFirstOrThrow();

  if (Number(assignResult.numUpdatedRows) !== 1) {
    throw new Error('Unexpected number of rows would have been updated. Throw error to initialize rollback.');
  }

  return;
}

export async function deassignIsmnIdentifier(manifestationId: number, trx: Transaction<Database>, user: RequestUser) {
  const assignResult = await trx
    .updateTable('ismn_identifier')
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

export function validateIsmnIdentifier(ismnIdentifierWithDashes: string): void {
  if (ismnIdentifierWithDashes.length !== 17) {
    throw new Error(
      `ISMN identifier must be exactly 17 characters long with dashes in place. ${ismnIdentifierWithDashes} has ${ismnIdentifierWithDashes.length} characters and thus is not valid.`,
    );
  }

  const [gs1, registration_group, publisher_element, item_element, check_digit, ...rest] =
    ismnIdentifierWithDashes.split('-');

  if (gs1 !== ISMN_VALID_GS1['979']) {
    throw new Error(`GS1 ${gs1} is not valid for ISMN identifier`);
  }

  if (registration_group !== ISMN_VALID_REGISTRATION_GROUPS['0']) {
    throw new Error(`Registrant group ${registration_group} is not valid for ISMN identifier`);
  }

  if (!publisher_element) {
    throw new Error("Publisher element is not defined and it's a required element in ISMN identifier");
  }

  if (publisher_element.length < 3) {
    throw new Error(`Publisher element ${publisher_element} is too short for ISMN identifier (minimum length: 3)`);
  }

  if (publisher_element.length > 7) {
    throw new Error(`Publisher element ${publisher_element} is too long for ISMN identifier (maximum length: 7)`);
  }

  if (!/^[0-9]{3,7}$/.test(publisher_element)) {
    throw new Error(
      `Publisher element ${publisher_element} cannot contain other characters than numbers in ISMN identifier`,
    );
  }

  if (!item_element) {
    throw new Error("Item element is not defined and it's a required element in ISMN identifier");
  }

  if (item_element.length < 1) {
    throw new Error(`Item element ${item_element} is too short for ISMN identifier (minimum length: 1)`);
  }

  if (item_element.length > 5) {
    throw new Error(`Item element ${item_element} is too long for ISMN identifier (maximum length: 5)`);
  }

  const identifierWithoutCheckDigit = `${gs1}${registration_group}${publisher_element}${item_element}`;
  if (identifierWithoutCheckDigit.length !== 12) {
    throw new Error(
      `ISMN identifier without dashes and check digit must be exactly 12 characters long. ${identifierWithoutCheckDigit} has length of ${identifierWithoutCheckDigit.length}`,
    );
  }

  if (!/^[0-9]{12}$/.test(identifierWithoutCheckDigit)) {
    throw new Error(
      `ISMN identifier without dashes may only contain numbers. String ${identifierWithoutCheckDigit} did not satisfy the requirement.`,
    );
  }

  if (!check_digit) {
    throw new Error("Item check digit is not defined and it's a required element in ISMN identifier");
  }

  if (rest.length !== 0) {
    throw new Error(
      `Given string ${ismnIdentifierWithDashes} contains elements that are undefined for ISMN identifier (${JSON.stringify(rest)}).`,
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

  // Process split per description in ISMN manual
  const total = weightedSum + Number(check_digit);
  if (total % 10 !== 0) {
    throw new Error(`Item check digit ${check_digit} does not satisfy the condition determined for it`);
  }
}
