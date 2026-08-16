import ISBN from 'isbn3';

import { SYSTEM_USER, ISBN_IDENTIFIER_LENGTH } from '../../constants.ts';
import { ISBN_VALID_GS1, ISBN_VALID_REGISTRATION_GROUPS } from '../../constants/monograph/isbn-constants.ts';

import { calculateIsbnIsmnCheckDigit } from './monograph-identifier-utils.ts';
import { validateIsbnIdentifier } from './isbn-identifier-utils.ts';
import { getCurrentTime } from '../shared-interface-utils.ts';
import { getKysely } from '../../db/database.ts';

import type { IsbnIdentifierInsert } from '../../db/types/monograph/types-isbn-identifier.ts';
import type { IsbnPublisherRangeSelect } from '../../db/types/monograph/types-isbn-publisher-range.ts';
import type { IsbnRangeSelect } from '../../db/types/monograph/types-isbn-range.ts';

export function getIsbnPublisherIdentifierParts(isbnPublisherIdentifier: string) {
  const [gs1, registrationGroup, registrant, ...rest] = isbnPublisherIdentifier.split('-');
  const gs1IsValid = !!gs1 && Object.values(ISBN_VALID_GS1).includes(gs1);
  const registrationGroupIsValid =
    !!registrationGroup && Object.values(ISBN_VALID_REGISTRATION_GROUPS).includes(registrationGroup);
  const registrantNumber = Number(registrant);

  if (!gs1IsValid) {
    throw new Error(`Invalid gs1 value prevents providing publisher identifier parts: ${gs1}`);
  }

  if (!registrationGroupIsValid) {
    throw new Error(
      `Invalid registration group value prevents providing publisher identifier parts: ${registrationGroup}`,
    );
  }

  if (!registrant) {
    throw new Error(`Invalid registrant value prevents providing publisher identifier parts: ${registrant}`);
  }

  if (isNaN(registrantNumber)) {
    throw new Error(
      `Invalid registrant number value prevents providing publisher identifier parts: ${registrantNumber}`,
    );
  }

  if (rest.length !== 0) {
    throw new Error(
      `Invalid registrant number value prevents providing publisher identifier parts: ${registrantNumber}`,
    );
  }

  return { gs1, registrationGroup, registrant };
}

export function getIsbnIdentifiers(publisherIdentifier: string) {
  const isbnIdentifiers = [];

  const { gs1, registrationGroup, registrant } = getIsbnPublisherIdentifierParts(publisherIdentifier);

  const checkDigitLength = 1; // For readability
  const publicationIdentifierLength =
    ISBN_IDENTIFIER_LENGTH - gs1.length - registrationGroup.length - registrant.length - checkDigitLength;

  const rangeEnd = Array.from({ length: publicationIdentifierLength })
    .map(() => '9')
    .join('');

  for (let i = 0; i <= Number(rangeEnd); i++) {
    const paddedItemNumber = `${i}`.padStart(publicationIdentifierLength, '0');
    const baseIdentifier = `${gs1}-${registrationGroup}-${registrant}-${paddedItemNumber}`;
    const baseIdentifierNoDashes = baseIdentifier.replaceAll('-', '');
    const checkdigit = calculateIsbnIsmnCheckDigit(baseIdentifierNoDashes);

    const isbnIdentifier = `${baseIdentifier}-${checkdigit}`;

    // Additional validation is done using custom function and external tool - overhead is considered worth it here
    validateIsbnIdentifier(isbnIdentifier);
    const auditResult = ISBN.audit(isbnIdentifier);

    if (auditResult.validIsbn === false) {
      throw new Error(`External audit has flagged ISBN ${isbnIdentifier} as invalid.`);
    }

    if (auditResult.groupname !== 'Finland') {
      throw new Error(`External audit has flagged ISBN ${isbnIdentifier} as non-Finnish.`);
    }

    isbnIdentifiers.push(isbnIdentifier);
  }

  return isbnIdentifiers;
}

export function isbnPublisherRangeContainsIdentifier(range: IsbnRangeSelect, publisherIdentifier: string) {
  const { gs1, registrationGroup, registrant } = getIsbnPublisherIdentifierParts(publisherIdentifier);

  // Validate against only range specific information as other validation was made by the helper
  const gs1Matches = gs1 === range.gs1;
  const registrationGroupMatches = registrationGroup === range.registration_group;
  const registrantNumber = Number(registrant);

  if (!gs1Matches || !registrationGroupMatches) {
    return false;
  }

  const rangeBeginNumber = Number(range.range_begin);
  const rangeEndNumber = Number(range.range_end);

  if (registrantNumber < rangeBeginNumber) {
    return false;
  }

  if (registrantNumber > rangeEndNumber) {
    return false;
  }

  return true;
}

export async function canDeleteIsbnPublisherRange(isbnPublisherRange: IsbnPublisherRangeSelect) {
  // Test if any identifier associated with ISBN publisher range is assigned to manifestation or batch
  const db = getKysely();
  const { count: identifierUsedCount } = await db
    .selectFrom('isbn_identifier')
    .select(db.fn.countAll<number>().as('count'))
    .where('isbn_publisher_range_id', '=', isbnPublisherRange.id)
    .where((eb) =>
      eb.or([
        eb('monograph_publication_manifestation_id', 'is not', null),
        eb('monograph_identifier_batch_id', 'is not', null),
      ]),
    )
    .executeTakeFirstOrThrow();

  if (identifierUsedCount !== 0) {
    return { result: false, reason: 'has assigned identifiers' };
  }

  // Check if any message is directly associated with the ISBN publisher range
  // If a message is associated with the publisher range, it means a identifiers have been made public
  const { numMessages } = await db
    .selectFrom('monograph_message')
    .select(db.fn.countAll<number>().as('numMessages'))
    .where('isbn_publisher_range_id', '=', isbnPublisherRange.id)
    .executeTakeFirstOrThrow();

  if (numMessages !== 0) {
    return { result: false, reason: 'has associated messages' };
  }

  return { result: true };
}

export function generateIsbnIdentifierDbEntry(
  isbnIdentifier: string,
  isbnPublisherRangeId: number,
): IsbnIdentifierInsert {
  return {
    identifier: isbnIdentifier,
    isbn_publisher_range_id: isbnPublisherRangeId,
    monograph_publication_manifestation_id: null,
    monograph_identifier_batch_id: null,
    created: getCurrentTime(),
    created_by: SYSTEM_USER,
    modified: getCurrentTime(),
    modified_by: SYSTEM_USER,
  };
}

export function getNumberOfIsbnIdentifiers(isbnPublisherRange: IsbnPublisherRangeSelect) {
  const { registrant } = getIsbnPublisherIdentifierParts(isbnPublisherRange.publisher_identifier);

  // DO NOT ALTER THIS UNLESS YOU ARE FULLY SURE WHAT YOU ARE DOING
  // Map represents number of ISBN identifiers for given length of registrant in ISBN publisher identifier
  const registrantIdentifierCountMap: Record<number, number> = {
    1: 100000,
    2: 10000,
    3: 1000,
    4: 100,
    5: 10,
  };

  const result = registrantIdentifierCountMap[registrant.length];
  if (!result) {
    throw new Error(`Could not map registrant length (${registrant.length}) to identifier count`);
  }

  return result;
}
