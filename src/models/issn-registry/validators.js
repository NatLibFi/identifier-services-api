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

import {calculateCheckDigitIssn} from '../../interfaces/issn-registry/rangeUtils';

export function isValidIssnIdentifier(value) {
  const issnIdentifierRegex = /^[0-9]{4}-[0-9]{3}[0-9X]$/; // eslint-disable-line require-unicode-regexp

  if (!issnIdentifierRegex.test(value)) {
    throw new Error('Only valid ISSN identifiers allowed');
  }

  // Verify check digit
  const identifierWithoutCheckDigit = value.slice(0, -1).replaceAll('-', '');
  const checkDigit = value.slice(-1);
  const calculatedCheckDigit = calculateCheckDigitIssn(identifierWithoutCheckDigit);

  if (checkDigit !== calculatedCheckDigit) {
    throw new Error('Invalid check digit');
  }
}
