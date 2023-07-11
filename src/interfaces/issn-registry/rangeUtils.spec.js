/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file.
 *
 * API service of Identifier Services system
 *
 * Copyright (C) 2023 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of identifier-services-api
 *
 * identifier-services-api program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * identifier-services-api is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 *
 */

import {assert} from 'chai';
import {calculateCheckDigitIssn, validateIssn} from './rangeUtils';

describe('ISSN check digit utils', () => {
  // Valid ISSNs fetched from portal.issn.org randomly from items having status of 'Confirmed'
  // One item per check digit value is tested
  const VALID_ISSN = [
    '2814-7790',
    '2814-9351',
    '1458-4492',
    '2242-1793',
    '1457-4764',
    '2953-8475',
    '0356-3936',
    '1457-9367',
    '2814-8738',
    '0036-4479',
    '2814-726X'
  ];

  const NOT_VALID_ISSN = [
    '2814-779X',
    '2814-9350',
    '1458-4491',
    '2242-1792',
    '1457-4763',
    '2953-8474',
    '0356-3935',
    '1457-9366',
    '2814-8737',
    '0036-4478',
    '2814-7269',
    '2814726X' // Otherwise valid, but misses the dash between the block and number values and thus is considered invalid
  ];

  const NOT_VALID_INPUT = [
    '281790', // six numbers
    '281493a', // includes letter
    1458449, // is integer, not string
    {'2242179': ''}, // object
    ['2953-847'] // array
  ];


  it('should calculate check digit correctly', () => {
    VALID_ISSN.forEach(v => {
      const expectedCheckDigit = v.substring(8, 9);
      const valueWithoutCheckDigit = v.substring(0, 8);
      const testValueWithoutDash = valueWithoutCheckDigit.replace(/-/ug, '');

      const resultWithDash = calculateCheckDigitIssn(valueWithoutCheckDigit);
      const resultWithoutDash = calculateCheckDigitIssn(testValueWithoutDash);

      assert.equal(expectedCheckDigit, resultWithDash);
      assert.equal(expectedCheckDigit, resultWithoutDash);
    });
  });

  it('should throw error if invalid input is given to check digit calculator', () => {
    NOT_VALID_INPUT.forEach(v => {
      assert.throws(() => calculateCheckDigitIssn(v), Error);
    });
  });

  it('should validate check digit correctly', () => {
    VALID_ISSN.forEach(v => {
      assert.equal(validateIssn(v), true);
    });

    NOT_VALID_ISSN.forEach(v => {
      assert.equal(validateIssn(v), false);
    });
  });

  it('should throw error if invalid input is given to check digit validator', () => {
    NOT_VALID_INPUT.forEach(v => {
      assert.throws(() => calculateCheckDigitIssn(v), Error);
    });
  });
});
