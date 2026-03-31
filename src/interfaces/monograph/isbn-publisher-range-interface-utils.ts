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

  // Test if any identifier associated with ISBN publisher range is either canceled or assigned to manifestation
  const db = getKysely();
  const { count: identifierUsedCount } = await db
    .selectFrom('isbn_identifier')
    .select(db.fn.countAll<number>().as('count'))
    .where('isbn_publisher_range_id', '=', isbnPublisherRange.id)
    .where((eb) => eb.or([eb('canceled', '=', true), eb('monograph_manifestation_id', 'is not', null)]))
    .executeTakeFirstOrThrow();

  if (identifierUsedCount !== 0) {
    return { result: false, reason: 'has canceled or assigned identifiers' };
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
    monograph_manifestation_id: null,
    canceled: false,
    created: getCurrentTime(),
    created_by: SYSTEM_USER,
    modified: getCurrentTime(),
    modified_by: SYSTEM_USER,
  };
}
