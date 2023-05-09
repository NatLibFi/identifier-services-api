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
import {ISBN_REGISTRY_ISMN_RANGE_LENGTH} from '../../constants';
import {testOverlap1, testOverlap2} from './isbnUtils';

/**
 * Creates payload for creating new ISBN range
 * @param {Object} doc Object containing base information
 * @param {Object} user User making the request
 * @returns ISMN range as object that can be saved to database using Sequelize ORM
 */
export function formatPayloadCreateIsmnRange(doc, user) {
  const {category, prefix, rangeBegin, rangeEnd} = doc;

  // Sanity check regarding ISBN range values
  validateRange();

  return {
    prefix,
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
    // prefix validation
    if (prefix !== '979-0') {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'ISMN range prefix can be only 979-0');
    }

    // Currently valid ISMN categories include categories 3, 5, 6, and 7
    const validCategories = [3, 5, 6, 7];
    if (isNaN(category) || !validCategories.includes(category)) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'ISMN range category can be only 3, 5, 6, or 7');
    }

    // Range must be within one valid category
    if (isNaN(rangeBegin) || isNaN(rangeEnd) ||
      rangeBegin.length !== rangeEnd.length ||
      rangeBegin.length !== category ||
      !validCategories.includes(rangeBegin.length)) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'Error in ISMN range rangeBegin and rangeEnd definitions');
    }

    // Range start must be smaller or equal when comparing to range end
    if (Number(rangeEnd) < Number(rangeBegin)) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'ISMN range rangeBegin cannot be smaller than rangeEnd');
    }
  }
}

/**
 * Formats ISMN identifier
 * @param {Object} range ISMN range containing prefix information
 * @param {string} publisherIdentifier Publisher unique identifier
 * @returns Formatted ISMN identifier
 */
export function formatPublisherIdentifierIsmn(range, publisherIdentifier) {
  return `${range.prefix}-${publisherIdentifier}`;
}

/**
 * Tests whether value given as argument has valid ISMN prefix
 * @param {string} value Value to test
 * @returns {boolean} True if value had valid ISMN prefix, otherwise false
 */
export function hasValidIsmnPrefix(value) {
  return (/^979-0/u).match(value);
}

/**
 * Tests whether ISMN range given as parameter overlaps any range found in array given as second parameter.
 * @param {Object} range Range to test
 * @param {Object[]} ismnRanges Array of ranges to test overlap against
 * @returns True if range overlaps any of the ranges found in array given as second parameter, otherwise false
 */
export function ismnRangeOverlapsExisting(range, ismnRanges) {
  // Each ranges RangeBegin and RangeEnd values need to be transformed into seven digit numbers
  // for being able to investigate range conflicts
  const formattedRanges = ismnRanges.map(v => ({
    prefix: v.prefix,
    rangeBegin: Number(v.rangeBegin.padEnd(ISBN_REGISTRY_ISMN_RANGE_LENGTH - 1, '0')),
    rangeEnd: Number(v.rangeEnd.padEnd(ISBN_REGISTRY_ISMN_RANGE_LENGTH - 1, '9'))
  }));

  const formattedRange = {
    prefix: range.prefix,
    rangeBegin: Number(range.rangeBegin.padEnd(ISBN_REGISTRY_ISMN_RANGE_LENGTH - 1, '0')),
    rangeEnd: Number(range.rangeEnd.padEnd(ISBN_REGISTRY_ISMN_RANGE_LENGTH - 1, '9'))
  };

  return formattedRanges.some(v => hasOverlap(v, formattedRange));

  /**
   * Wrapper for testing overlap between two ISMN ranges
   * @param {Object} range1 First range
   * @param {Object} range2 Second range
   * @returns True if ranges overlap, otherwise false
   */
  function hasOverlap(range1, range2) {
    return range1.prefix === range2.prefix &&
    (testOverlap1(range1, range2) || testOverlap2(range1, range2));
  }
}
