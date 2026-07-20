import { SYSTEM_USER, ISMN_IDENTIFIER_LENGTH } from '../../constants.ts';
import { calculateIsbnIsmnCheckDigit, validateIsmnIdentifier } from './monograph-identifier-utils.ts';
import { getCurrentTime } from '../shared-interface-utils.ts';
import { getKysely } from '../../db/database.ts';
import { getIsmnPublisherIdentifierParts } from './range-interface-utils.ts';

import type { IsmnIdentifierInsert } from '../../db/types/monograph/types-ismn-identifier.ts';
import type { IsmnPublisherRangeSelect } from '../../db/types/monograph/types-ismn-publisher-range.ts';

export function getIsmnIdentifiers(publisherIdentifier: string) {
  const ismnIdentifiers = [];

  const { gs1, registrationGroup, registrant } = getIsmnPublisherIdentifierParts(publisherIdentifier);

  const checkDigitLength = 1; // For readability
  const publicationIdentifierLength =
    ISMN_IDENTIFIER_LENGTH - gs1.length - registrationGroup.length - registrant.length - checkDigitLength;

  const rangeEnd = Array.from({ length: publicationIdentifierLength })
    .map(() => '9')
    .join('');

  for (let i = 0; i <= Number(rangeEnd); i++) {
    const paddedItemNumber = `${i}`.padStart(publicationIdentifierLength, '0');
    const baseIdentifier = `${gs1}-${registrationGroup}-${registrant}-${paddedItemNumber}`;
    const baseIdentifierNoDashes = baseIdentifier.replaceAll('-', '');
    const checkdigit = calculateIsbnIsmnCheckDigit(baseIdentifierNoDashes);

    const ismnIdentifier = `${baseIdentifier}-${checkdigit}`;

    // Additional validation is done just in case using external tool - overhead is considered worth it here
    validateIsmnIdentifier(ismnIdentifier);

    ismnIdentifiers.push(ismnIdentifier);
  }

  return ismnIdentifiers;
}

export async function canDeleteIsmnPublisherRange(ismnPublisherRange: IsmnPublisherRangeSelect) {
  // API v1 had tests regarding associated identifiers and batches -> the new schema does not support these checks

  // Test if any identifier associated with ISMN publisher range is assigned to manifestation
  const db = getKysely();
  const { count: identifierUsedCount } = await db
    .selectFrom('ismn_identifier')
    .select(db.fn.countAll<number>().as('count'))
    .where('ismn_publisher_range_id', '=', ismnPublisherRange.id)
    .where('monograph_publication_manifestation_id', 'is not', null)
    .executeTakeFirstOrThrow();

  if (identifierUsedCount !== 0) {
    return { result: false, reason: 'has assigned identifiers' };
  }

  // Check if any message is directly associated with the ISMN publisher range
  // If a message is associated with the publisher range, it means a identifiers have been made public
  const { numMessages } = await db
    .selectFrom('monograph_message')
    .select(db.fn.countAll<number>().as('numMessages'))
    .where('ismn_publisher_range_id', '=', ismnPublisherRange.id)
    .executeTakeFirstOrThrow();

  if (numMessages !== 0) {
    return { result: false, reason: 'has associated messages' };
  }

  return { result: true };
}

export function generateIsmnIdentifierDbEntry(
  ismnIdentifier: string,
  ismnPublisherRangeId: number,
): IsmnIdentifierInsert {
  return {
    identifier: ismnIdentifier,
    ismn_publisher_range_id: ismnPublisherRangeId,
    monograph_publication_manifestation_id: null,
    created: getCurrentTime(),
    created_by: SYSTEM_USER,
    modified: getCurrentTime(),
    modified_by: SYSTEM_USER,
  };
}

export function getNumberOfIsmnIdentifiers(ismnPublisherRange: IsmnPublisherRangeSelect) {
  const { registrant } = getIsmnPublisherIdentifierParts(ismnPublisherRange.publisher_identifier);

  // DO NOT ALTER THIS UNLESS YOU ARE FULLY SURE WHAT YOU ARE DOING
  // Map represents number of ISMN identifiers for given length of registrant in ISMN publisher identifier
  const registrantIdentifierCountMap: Record<number, number> = {
    3: 100000,
    4: 10000,
    5: 1000,
    6: 100,
    7: 10,
  };

  const result = registrantIdentifierCountMap[registrant.length];
  if (!result) {
    throw new Error(`Could not map registrant length (${registrant.length}) to identifier count`);
  }

  return result;
}
