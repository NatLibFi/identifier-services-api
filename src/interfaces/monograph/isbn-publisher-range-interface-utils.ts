import ISBN from 'isbn3';

import { SYSTEM_USER, ISBN_IDENTIFIER_LENGTH } from '../../constants.ts';
import { calculateIsbn13CheckDigit } from '../interface-utils/monograph-identifier-utils.ts';
import { getCurrentTime } from '../interface-utils/common-interface-utils.ts';
import { getKysely } from '../../db/database.ts';
import { getPublisherIdentifierParts } from '../interface-utils/range-interface-utils.ts';

import type { IsbnIdentifierInsert } from '../../db/types/monograph/types-isbn-identifier.ts';
import type { IsbnPublisherRangeSelect } from '../../db/types/monograph/types-isbn-publisher-range.ts';

export function getIsbnIdentifiers(publisherIdentifier: string) {
  const isbnIdentifiers = [];

  const { gs1, registrationGroup, registrant } = getPublisherIdentifierParts(publisherIdentifier);

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
    const checkdigit = calculateIsbn13CheckDigit(baseIdentifierNoDashes);

    const isbnIdentifier = `${baseIdentifier}-${checkdigit}`;

    // Additional validation is done using external tool - overhead is considered worth it here
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

export async function canDeleteIsbnPublisherRange(isbnPublisherRange: IsbnPublisherRangeSelect) {
  // API v1 had tests regarding associated identifiers and batches -> the new schema does not support these checks

  // Test if any identifier associated with ISBN publisher range is assigned to manifestation
  const db = getKysely();
  const { count: identifierUsedCount } = await db
    .selectFrom('isbn_identifier')
    .select(db.fn.countAll<number>().as('count'))
    .where('isbn_publisher_range_id', '=', isbnPublisherRange.id)
    .where('monograph_publication_manifestation_id', 'is not', null)
    .executeTakeFirstOrThrow();

  if (identifierUsedCount !== 0) {
    return { result: false, reason: 'has assigned identifiers' };
  }

  // TODO: figure out way to verify no ISBN identifiers has not been made public or used as well as add any other required logic
  // E.g., if identifier range is associated with message or download action it has been made public in verified manner
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
    created: getCurrentTime(),
    created_by: SYSTEM_USER,
    modified: getCurrentTime(),
    modified_by: SYSTEM_USER,
  };
}

export function getNumberOfIdentifiers(isbnPublisherRange: IsbnPublisherRangeSelect) {
  const [gs1, registrationGroup, registrant] = isbnPublisherRange.publisher_identifier.split('-');

  // Sanity checks
  if (!gs1 || !registrationGroup || !registrant) {
    throw new Error(`Invalid publisher identifier observed in ISBN publisher range id ${isbnPublisherRange.id}`);
  }

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
