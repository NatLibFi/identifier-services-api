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

import {calculateCheckDigitIsbn} from '../../interfaces/isbn-registry/ranges/isbnUtils';

export function isValidIsbnOrIsmnIdentifier(value) {
  // Note: ISBN validation regexp considers only Finnish ISBN language groups
  const isbnIdentifierRegex = /^978-95(?:1|2)-[0-9]{1,5}-[0-9]{1,5}-[0-9]$/; // eslint-disable-line require-unicode-regexp
  const ismnIdentifierRegex = /^979-0-[0-9]{3,7}-[0-9]{1,5}-[0-9]$/; // eslint-disable-line require-unicode-regexp

  if (!isbnIdentifierRegex.test(value) && !ismnIdentifierRegex.test(value)) {
    throw new Error('Only ISBN and ISMN identifier values are allowed!');
  }

  // Verify check digit
  const identifierWithoutCheckDigit = value.slice(0, -1).replaceAll('-', '');
  const checkDigit = value.slice(-1);
  const calculatedCheckDigit = calculateCheckDigitIsbn(identifierWithoutCheckDigit);

  if (checkDigit !== calculatedCheckDigit) {
    throw new Error('Invalid check digit!');
  }
}
