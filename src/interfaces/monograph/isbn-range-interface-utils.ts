import { ISBN_RANGE_MAX_LENGTH } from '../../constants/monograph/isbn-constants.ts';
import { getKysely } from '../../db/database.ts';
import type { CreateIsbnRangeHttp } from '../../validations/monograph/isbn-range-validation.ts';
import { testRangeOverlap } from '../interface-utils/range-interface-utils.ts';

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
