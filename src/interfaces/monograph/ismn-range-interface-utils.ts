import { ISMN_RANGE_MAX_LENGTH } from '../../constants/monograph/ismn-constants.ts';

import { getKysely } from '../../db/database.ts';

import { generateRangeArray } from '../../utils/generic-utils.ts';
import { testRangeOverlap } from './monograph-range-utils.ts';

import type { IsmnRangeSelect } from '../../db/types/monograph/types-ismn-range.ts';
import type { CreateIsmnRangeHttp } from '../../validations/monograph/ismn-range-validation.ts';

export async function getIsmnRangeConflict(ismnRangeCreateDoc: CreateIsmnRangeHttp) {
  const db = getKysely();
  const currentIsmnRanges = await db.selectFrom('ismn_range').selectAll().execute();

  const conflictingRanges = currentIsmnRanges.filter((currentIsmnRange) => {
    const gs1Matches = currentIsmnRange.gs1 === ismnRangeCreateDoc.gs1;
    const registrationGroupMatches = currentIsmnRange.registration_group === ismnRangeCreateDoc.registration_group;

    const currentRangeStartNumber = Number(currentIsmnRange.range_begin.padEnd(ISMN_RANGE_MAX_LENGTH, '0'));
    const currentRangeEndNumber = Number(currentIsmnRange.range_end.padEnd(ISMN_RANGE_MAX_LENGTH, '9'));
    const currentRangeTestDoc = { rangeBegin: currentRangeStartNumber, rangeEnd: currentRangeEndNumber };

    const testedRangeStartNumber = Number(ismnRangeCreateDoc.range_begin.padEnd(ISMN_RANGE_MAX_LENGTH, '0'));
    const testedRangeEndNumber = Number(ismnRangeCreateDoc.range_end.padEnd(ISMN_RANGE_MAX_LENGTH, '9'));
    const testedRangeTestDoc = { rangeBegin: testedRangeStartNumber, rangeEnd: testedRangeEndNumber };

    const rangesOverlap = testRangeOverlap(currentRangeTestDoc, testedRangeTestDoc);

    return gs1Matches && registrationGroupMatches && rangesOverlap;
  });

  return conflictingRanges;
}

export async function getAvailableIsmnPublisherRanges(ismnRange: IsmnRangeSelect) {
  const db = getKysely();

  const ismnRangePublisherIdentifiers = getAllIsmnPublisherRanges(ismnRange);
  const associatedIsmnPublisherRanges = await db
    .selectFrom('ismn_publisher_range')
    .selectAll()
    .where('ismn_range_id', '=', ismnRange.id)
    .execute();
  const associatedPublisherIdentifiers = associatedIsmnPublisherRanges.map(
    ({ publisher_identifier }) => publisher_identifier,
  );

  return ismnRangePublisherIdentifiers.filter(
    (publisherIdentifier) => !associatedPublisherIdentifiers.includes(publisherIdentifier),
  );
}

export function getAllIsmnPublisherRanges(ismnRange: IsmnRangeSelect) {
  const { gs1, registration_group, range_begin, range_end } = ismnRange;

  return generateRangeArray(Number(range_end) - Number(range_begin) + 1)
    .map((_, i) => i + Number(range_begin))
    .map((v) => String(v).padStart(range_begin.length, '0'))
    .map((registrant) => `${gs1}-${registration_group}-${registrant}`);
}
