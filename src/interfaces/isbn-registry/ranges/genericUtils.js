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

import {COMMON_IDENTIFIER_TYPES} from '../../constants';

/**
 * Tests whether publisher identifier is valid for the range given as parameter
 * @param {Object} range Range for which to test validity of publisher identifier
 * @param {string} publisherIdentifier Publisher identifier which validity to test
 * @returns True is identifier is valid for range, otherwise false
 */
function isValidPublisherIdentifierInRange(range, publisherIdentifier) {
  const identifier = Number(publisherIdentifier);

  if (isNaN(identifier)) {
    return false;
  }

  return identifier >= Number(range.rangeBegin) && identifier <= Number(range.rangeEnd);
}

/**
 * Validates that the publisher identifier belongs to range given as parameter
 * @param {string} fullIdentifierString Full publisher identifier (including prefix and langGroup for ISBN) to test
 * @param {Object} range Range to test identifier
 * @returns Return false if publisher identifier was not part of range, otherwise returns true
 */
export function publisherIdentifierBelongsToRange(fullIdentifierString, range, identifierType) {
  if (identifierType === COMMON_IDENTIFIER_TYPES.ISBN) {
    return _validateIsbn(fullIdentifierString, range);
  } else if (identifierType === COMMON_IDENTIFIER_TYPES.ISMN) {
    return _validateIsmn(fullIdentifierString, range);
  }

  throw new Error('Unsupported identifier type');

  function _validateIsbn(identifier, range) {
    const [prefix, langGroup, identifierString, ...rest] = identifier.split('-');

    // There should be no "rest" values
    if (rest.length > 0) {
      return false;
    }

    // Prefix should match range prefix
    if (Number(prefix) !== range.prefix) {
      return false;
    }

    // LangGroup should match range LangGroup
    if (Number(langGroup) !== range.langGroup) {
      return false;
    }

    // Identifier length should match range category
    if (identifierString.length !== range.category) {
      return false;
    }

    // Finally, the chosen identifier should belong to range
    return isValidPublisherIdentifierInRange(range, identifierString);
  }

  function _validateIsmn(identifier, range) {
    const [prefix0, prefix1, identifierString, ...rest] = identifier.split('-');

    // There should be no "rest" values
    if (rest.length > 0) {
      return false;
    }

    // Prefix should match range prefix
    if (`${prefix0}-${prefix1}` !== range.prefix) {
      return false;
    }

    // Identifier length should match range category
    if (identifierString.length !== range.category) {
      return false;
    }

    // Finally, the chosen identifier should belong to range
    return isValidPublisherIdentifierInRange(range, identifierString);
  }
}
