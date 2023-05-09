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

/* Based on original work by Petteri Kivimäki (Identifier Registry) */

import HttpStatus from 'http-status';

import {ApiError} from '../../../utils';
import {COMMON_IDENTIFIER_TYPES, ISBN_REGISTRY_ISBN_RANGE_LENGTH} from '../../constants';

/**
 * Creates payload for creating new ISBN range
 * @param {Object} doc Object containing base information
 * @param {Object} user User making the request
 * @returns ISBN range as object that may be saved to database through Sequelize ORM
 */
export function formatPayloadCreateIsbnRange(doc, user) {
  const {category, prefix, langGroup, rangeBegin, rangeEnd} = doc;

  // Sanity check regarding ISBN range values
  validateRange();

  return {
    prefix,
    langGroup,
    category,
    rangeBegin,
    rangeEnd,
    free: Number(rangeEnd) - Number(rangeBegin) + 1,
    taken: 0,
    canceled: 0,
    next: rangeBegin,
    isActive: true,
    isClosed: false,
    createdBy: user.id,
    modifiedBy: user.id
  };

  /** Validates values used for range creation */
  function validateRange() {
    // GS1-validation
    if (prefix !== 978 && prefix !== 979) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'Prefix can be only either 978 or 979');
    }

    // Country or language code validation
    if (langGroup !== 951 && langGroup !== 952) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'Language group can be only either 951 or 952');
    }

    // Currently valid ISBN categories include range 1-5
    if (isNaN(category) || category < 1 || category > 5) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'Category can be only integer between 1 and 5');
    }

    // Range must be within one valid category
    if (isNaN(rangeBegin) || isNaN(rangeEnd) ||
      rangeBegin.length !== rangeEnd.length ||
      rangeBegin.length > 5 ||
      rangeBegin.length < 1 ||
      rangeBegin.length !== category) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'Error in rangeBegin and rangeEnd definitions');
    }

    // Range start must be smaller than or equal to range end
    if (Number(rangeEnd) < Number(rangeBegin)) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'rangeBegin cannot be smaller than rangeEnd');
    }
  }
}

/**
 * Formats publisher identifier given the range object and publisher identifier
 * @param {Object} range Range publisher identifier belongs to
 * @param {string} publisherIdentifier Publisher identifier
 * @returns Formatted publisher identifier as string
 */
export function formatPublisherIdentifierIsbn(range, publisherIdentifier) {
  return `${range.prefix}-${range.langGroup}-${publisherIdentifier}`;
}

/**
 * Tests whether value given as parameter has valid Finnish ISBN prefix and language group
 * @param {string} value Value to tests
 * @returns True if value has valid prefix and langGroup, otherwise false
 */
export function hasValidIsbnPrefixAndFinnishLang(value) {
  return (/^(?:978|979)-(?:951|952)-/u).match(value);
}

/**
 * Calculates check digit for ISBN identifier. Input must not include dashes.
 * Supports only ISBN-13.
 * @param {string} isbn ISBN to calculate check digit for
 * @returns Check digit in string format
 */
export function calculateCheckDigitIsbn(isbn) {
  if (isbn.match(/^[0-9]{12}$/u)) {
    return calculateIsbn13CheckDigit(isbn);
  }

  // Unsupported
  throw new Error('Cannot calculate check digit for given ISBN');

  /**
   * Calculates ISBN-13 check digit. Used also for calculating ISMN check digit.
   * @param {string} identifier ISBN-13 identifier without check digit and dashes (ISBN-13 or ISMN)
   * @returns Check digit in string format
   */
  /* eslint-disable functional/no-conditional-statements,no-param-reassign,no-extra-parens */
  function calculateIsbn13CheckDigit(identifier) {
    const sum = identifier.split('').reduce((acc, char, i) => {
      if (i % 2 === 0) {
        acc += Number(char) * 1;
      } else {
        acc += Number(char) * 3;
      }
      return acc;
    }, 0);

    return `${(10 - (sum % 10)) % 10}`;
  }
  /* eslint-enable functional/no-conditional-statements,no-param-reassign,no-extra-parens */
}

/**
 * Tests whether ISBN range given as parameter overlaps any range found in array given as second parameter.
 * @param {Object} range Range to test
 * @param {Object[]} isbnRanges Array of ranges to test overlap against
 * @returns True if range overlaps any of the ranges found in array given as second parameter, otherwise false
 */
export function isbnRangeOverlapsExisting(range, isbnRanges) {
  // Each ranges RangeBegin and RangeEnd values need to be transformed into five digit numbers
  // for being able to investigate range conflicts
  const formattedRanges = isbnRanges.map(v => ({
    prefix: v.prefix,
    langGroup: v.langGroup,
    rangeBegin: Number(v.rangeBegin.padEnd(ISBN_REGISTRY_ISBN_RANGE_LENGTH - 1, '0')),
    rangeEnd: Number(v.rangeEnd.padEnd(ISBN_REGISTRY_ISBN_RANGE_LENGTH - 1, '9'))
  }));

  const formattedRange = {
    prefix: range.prefix,
    langGroup: range.langGroup,
    rangeBegin: Number(range.rangeBegin.padEnd(ISBN_REGISTRY_ISBN_RANGE_LENGTH - 1, '0')),
    rangeEnd: Number(range.rangeEnd.padEnd(ISBN_REGISTRY_ISBN_RANGE_LENGTH - 1, '9'))
  };

  return formattedRanges.some(v => hasOverlap(v, formattedRange));

  /**
   * Wrapper for testing overlap between two ranges
   * @param {Object} range1 First range
   * @param {Object} range2 Second range
   * @returns True if ranges overlap, otherwise false
   */
  function hasOverlap(range1, range2) {
    return range1.prefix === range2.prefix &&
    range1.langGroup === range2.langGroup &&
    (testOverlap1(range1, range2) || testOverlap2(range1, range2));
  }
}

/**
 * Function to test whether ranges overlap. Example of overlap:
 *       |-----|
 *    |-----|
 * @param {Object} range1 First range
 * @param {Object} range2 Second range
 * @returns True if ranges overlap, otherwise false
 */
export function testOverlap1(range1, range2) {
  return range1.rangeBegin >= range2.rangeBegin && range1.rangeBegin <= range2.rangeEnd;
}

/**
 * Function to test whether ranges overlap. Example of overlap:
 *       |-----|
 *           |-----|
 * @param {Object} range1 First range
 * @param {Object} range2 Second range
 * @returns True if ranges overlap, otherwise false
 */
export function testOverlap2(range1, range2) {
  return range1.rangeBegin <= range2.rangeBegin && range1.rangeEnd >= range2.rangeBegin;
}

/**
 * Validate ISBN and ISMN identifiers. Required as bulk insert to db would not use virtual sequelize validator.
 * @param {string} identifier identifier to validate
 * @param {string} identifierType whether identifier is ISBN or ISMN
 */
export function isValidIdentifier(identifier, identifierType) {
  // ISBN and ISMN identifiers both share the length of identifier with dashes, which should result to 17
  if (typeof identifier !== 'string' || identifier.length !== 17) {
    return false;
  }

  if (identifierType === COMMON_IDENTIFIER_TYPES.ISBN) {
    return validateIsbnIdentifier(identifier);
  } else if (identifierType === COMMON_IDENTIFIER_TYPES.ISMN) {
    return validateIsmnIdentifier(identifier);
  }

  throw new Error('Could not validate identifier, unsupported identifier type');

  function validateIsbnIdentifier(identifier) {
    const [prefix, langGroup, publisherIdentifier, itemNumber, checkDigit, ...rest] = identifier.split('-');

    if (!['979', '978'].includes(prefix)) {
      return false;
    }

    if (!['951', '952'].includes(langGroup)) {
      return false;
    }

    if (isNaN(Number(publisherIdentifier)) || publisherIdentifier.length === 0 || publisherIdentifier.length > 5) {
      return false;
    }

    if (isNaN(Number(itemNumber)) || itemNumber.length === 0) {
      return false;
    }

    if (isNaN(Number(checkDigit)) || checkDigit.length !== 1) {
      return false;
    }

    if (rest.length !== 0) {
      return false;
    }

    return calculateCheckDigitIsbn(`${prefix}${langGroup}${publisherIdentifier}${itemNumber}`) === checkDigit;
  }

  function validateIsmnIdentifier(identifier) {
    const [prefixA, prefixB, publisherIdentifier, itemNumber, checkDigit, ...rest] = identifier.split('-');
    if (!['979'].includes(prefixA)) {
      return false;
    }

    if (!['0'].includes(prefixB)) {
      return false;
    }

    if (isNaN(Number(publisherIdentifier)) || publisherIdentifier.length === 0 || publisherIdentifier.length > 7) {
      return false;
    }

    if (isNaN(Number(itemNumber)) || itemNumber.length === 0) {
      return false;
    }

    if (isNaN(Number(checkDigit)) || checkDigit.length !== 1) {
      return false;
    }

    if (rest.length !== 0) {
      return false;
    }

    return calculateCheckDigitIsbn(`${prefixA}${prefixB}${publisherIdentifier}${itemNumber}`) === checkDigit;
  }
}
