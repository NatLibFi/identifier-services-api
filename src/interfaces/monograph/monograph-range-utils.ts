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
