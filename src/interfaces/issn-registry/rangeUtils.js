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

/* Based on original work by Petteri Kivimäki https://github.com/petkivim/ (Identifier Registry) */

/**
 * Generates ISSN check digit as described in ISSN manual
 * @param {string} issnWithoutCheckDigit ISSN number without the check digit (e.g., block and number)
 * @returns {string} Check digit if the input value was valid and check digit is considered valid, otherwise throws an error
 */
/* eslint-disable functional/no-let */
export function calculateCheckDigitIssn(issnWithoutCheckDigit) {
  // Remove dash if there is one
  const formattedIssnWithoutCheckDigit = issnWithoutCheckDigit.replace('-', '');

  // Validate issn consists now from seven digits
  if (!inputIsValid(formattedIssnWithoutCheckDigit)) {
    throw new Error('Cannot generate issn check digit for invalid input');
  }

  let sumOfDigits = 0;

  // eslint-disable-next-line functional/no-loop-statements
  for (let i = 0; i < formattedIssnWithoutCheckDigit.length; i++) {
    sumOfDigits += Number(formattedIssnWithoutCheckDigit.charAt(i)) * (8 - i);
  }

  const checkDigit = (11 - (sumOfDigits % 11)) % 11;

  // Validate that the value is sane
  if (isNaN(checkDigit) || checkDigit < 0 || checkDigit > 10) {
    throw new Error('Check digit generation has generated an invalid check digit');
  }

  return checkDigit === 10 ? 'X' : checkDigit.toString();

  // Tests input consists of string length of 7 and each character is a number
  function inputIsValid(v) {
    return v.match(/^[0-9]{7}$/);
  }
}
/* eslint-enable functional/no-let */

/**
 * Utility function to validate ISSN identifier
 * @param {string} issn ISSN identifier to validate
 * @returns {boolean} True if ISSN given as parameter si valid, otherwise false
 */
export function validateIssn(issn) {
  if (!issn.match(/^[0-9]{4}-[0-9]{3}[0-9X]{1}$/)) {
    return false;
  }

  const checkDigit = calculateCheckDigitIssn(issn.replace('-', '').substring(0, 7));
  if (checkDigit !== issn.slice(-1)) {
    return false;
  }

  return true;
}
