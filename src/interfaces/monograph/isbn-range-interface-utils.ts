import { ISBN_RANGE_MAX_LENGTH } from '../../constants/monograph/isbn-constants.ts';
import { getKysely } from '../../db/database.ts';
import type { IsbnRangeSelect } from '../../db/types/monograph/types-isbn-range.ts';
import { generateRangeArray } from '../../utils/generic-utils.ts';
import type { CreateIsbnRangeHttp } from '../../validations/monograph/isbn-range-validation.ts';
import { testRangeOverlap } from '../interface-utils/range-interface-utils.ts';
import { readIsbnRange } from './isbn-range-interface.ts';

/**
 * Find potential conflicts with currently defined ISBN ranges. Conflict occurs if:
 *- Two ranges have equal gs1 and registration_group AND
 *- Ranges have any kind of overlap. Note that overlap is evaluated not only based on range category but also between separate categories (e.g., 1 does overlap 10000-19999)
 */
export async function getIsbnRangeConflict(isbnRangeCreateDoc: CreateIsbnRangeHttp) {
  const db = getKysely();
  const currentIsbnRanges = await db.selectFrom('isbn_range').selectAll().execute();

  const conflictingRanges = currentIsbnRanges.filter((currentIsbnRange) => {
    const gs1Matches = currentIsbnRange.gs1 === isbnRangeCreateDoc.gs1;
    const registrationGroupMatches = currentIsbnRange.registration_group === isbnRangeCreateDoc.registration_group;

    const currentRangeStartNumber = Number(currentIsbnRange.range_begin.padEnd(ISBN_RANGE_MAX_LENGTH, '0'));
    const currentRangeEndNumber = Number(currentIsbnRange.range_end.padEnd(ISBN_RANGE_MAX_LENGTH, '9'));
    const currentRangeTestDoc = { rangeBegin: currentRangeStartNumber, rangeEnd: currentRangeEndNumber };

    const testedRangeStartNumber = Number(isbnRangeCreateDoc.range_begin.padEnd(ISBN_RANGE_MAX_LENGTH, '0'));
    const testedRangeEndNumber = Number(isbnRangeCreateDoc.range_end.padEnd(ISBN_RANGE_MAX_LENGTH, '9'));
    const testedRangeTestDoc = { rangeBegin: testedRangeStartNumber, rangeEnd: testedRangeEndNumber };

    const rangesOverlap = testRangeOverlap(currentRangeTestDoc, testedRangeTestDoc);

    return gs1Matches && registrationGroupMatches && rangesOverlap;
  });

  return conflictingRanges;
}

export async function getAvailableIsbnPublisherRanges(isbnRangeId: number) {
  const db = getKysely();

  const isbnRange = await readIsbnRange(isbnRangeId, true);
  const isbnRangePublisherIdentifiers = getAllIsbnPublisherRanges(isbnRange);
  const associatedIsbnPublisherRanges = await db
    .selectFrom('isbn_publisher_range')
    .selectAll()
    .where('isbn_range_id', '=', isbnRange.id)
    .execute();
  const associatedPublisherIdentifiers = associatedIsbnPublisherRanges.map(
    ({ publisher_identifier }) => publisher_identifier,
  );

  return isbnRangePublisherIdentifiers.filter(
    (publisherIdentifier) => !associatedPublisherIdentifiers.includes(publisherIdentifier),
  );
}

export function getAllIsbnPublisherRanges(isbnRange: IsbnRangeSelect) {
  const { gs1, registration_group, range_begin, range_end } = isbnRange;

  return generateRangeArray(Number(range_end) - Number(range_begin) + 1)
    .map((_, i) => i + Number(range_begin))
    .map((v) => String(v).padStart(range_begin.length, '0'))
    .map((registrant) => `${gs1}-${registration_group}-${registrant}`);
}
