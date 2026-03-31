import { ISBN_VALID_GS1, ISBN_VALID_REGISTRATION_GROUPS } from '../../constants/monograph/isbn-constants.ts';
import type { IsbnRangeSelect } from '../../db/types/monograph/types-isbn-range.ts';

export interface RangeIncludeTestInput {
  gs1: string;
  registration_group: string;
  range_begin: string;
  range_end: string;
}

export interface RangeOverlapTestInput {
  rangeBegin: number;
  rangeEnd: number;
}

/**
 * Wrapper to see whether two ranges overlap or not
 */
export function testRangeOverlap(range1: RangeOverlapTestInput, range2: RangeOverlapTestInput) {
  return testOverlap1(range1, range2) || testOverlap2(range1, range2);
}

/**
 * Function to test whether ranges overlap in certain way. Example of overlap:
 *       |-----|
 *    |-----|
 */
export function testOverlap1(range1: RangeOverlapTestInput, range2: RangeOverlapTestInput) {
  return range1.rangeBegin >= range2.rangeBegin && range1.rangeBegin <= range2.rangeEnd;
}

/**
 * Function to test whether ranges overlap in certain way. Example of overlap:
 *       |-----|
 *           |-----|
 */
export function testOverlap2(range1: RangeOverlapTestInput, range2: RangeOverlapTestInput) {
  return range1.rangeBegin <= range2.rangeBegin && range1.rangeEnd >= range2.rangeBegin;
}

export function getPublisherIdentifierParts(publisherIdentifier: string) {
  const [gs1, registrationGroup, registrant, ...rest] = publisherIdentifier.split('-');
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

export function rangeContainsIdentifier(range: IsbnRangeSelect, publisherIdentifier: string) {
  const [gs1, registrationGroup, registrant] = publisherIdentifier.split('-');

  if (!getPublisherIdentifierParts(publisherIdentifier)) {
    return false;
  }

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
