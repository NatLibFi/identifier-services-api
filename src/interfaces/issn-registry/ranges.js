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

import HttpStatus from 'http-status';

import sequelize from '../../models';
import {ApiError} from '../../utils';
import abstractModelInterface from '../common/abstractModelInterface';
import {testOverlap1, testOverlap2} from '../isbn-registry/ranges/isbnUtils';
import {calculateCheckDigitIssn} from './rangeUtils';

/* eslint-disable max-lines */

/**
 * ISSN range interface. Contains CRUD operations and a number of helper functions.
 * @returns Interface to interact with ISSN ranges
 */
export default function () {
  const issnRangeModel = sequelize.models.issnRange;
  const issnCanceledModel = sequelize.models.issnCanceled;
  const issnUsedModel = sequelize.models.issnUsed;

  const issnRangeModelInterface = abstractModelInterface(issnRangeModel);

  return {
    create,
    read: issnRangeModelInterface.readJSON,
    remove,
    readAll,
    open,
    close,
    activate,
    deactivate
  };

  /**
   * Create ISSN range. Range may be created if it has valid begin and end values and values within the range
   * do not overlap any existing range.
   * @param {Object} doc Document containing new range information
   * @param {Object} user User creating the new publication
   * @returns {Object} Created range as object
   */
  /* eslint-disable max-statements,functional/no-conditional-statements */
  async function create(doc, user) {
    const t = await sequelize.transaction();
    try {
      // Test whether rangeBegin and rangeEnd values are sane
      if (!rangeEdgesAreValid(doc)) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot create range: New range would overlap existing range');
      }

      // Test whether range overlaps any existing range
      // Get existing ranges
      const existingRanges = await issnRangeModel.findAll({transaction: t});

      if (rangeOverlapsExisting({...doc}, existingRanges)) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot create range: New range would overlap existing range');
      }

      // Generate checkdigit for rangeBegin, rangeEnd and rangeNext
      const rangeBeginCheckDigit = calculateCheckDigitIssn(`${doc.block}${doc.rangeBegin}`);
      const rangeEndCheckDigit = calculateCheckDigitIssn(`${doc.block}${doc.rangeEnd}`);
      const rangeBegin = `${doc.rangeBegin}${rangeBeginCheckDigit}`;
      const rangeEnd = `${doc.rangeEnd}${rangeEndCheckDigit}`;

      // Disactivate other ranges if new range is set to active
      if (doc.isActive) {
        await issnRangeModel.update({isActive: false, modifiedBy: user.id}, {where: {isActive: true}, transaction: t});
      }

      // Generate dbdoc and save range to db
      const dbDoc = {
        block: doc.block,
        rangeBegin,
        rangeEnd,
        next: rangeBegin, // First next value is the beginning of the range since it includes the check digit in the ISSN model
        free: Number(doc.rangeEnd) - Number(doc.rangeBegin) + 1,
        taken: 0,
        canceled: 0,
        isActive: doc.isActive,
        isClosed: false,
        createdBy: user.id,
        modifiedBy: user.id
      };

      const result = await issnRangeModel.create(dbDoc, {transaction: t});

      // Commit transaction
      await t.commit();

      return result.toJSON();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * Validates rangeBegin and rangeEnd value so that they are sane. Format validation of block, rangeBegin and rangeEnd
   * is done in validation of request body using Celebrate + Joi.
   * @param {Object} range Range object coming through user input
   * @returns true if rangeBegin and rangeEnd values are sane, otherwise false
   */
  function rangeEdgesAreValid({rangeBegin, rangeEnd}) {
    // Range begin or end cannot be evaluated as nan when transformed to integer
    if (isNaN(Number(rangeBegin)) || isNaN(Number(rangeEnd))) {
      return false;
    }

    // Range start must be smaller than or equal to range end in order for the range to be valid
    if (Number(rangeEnd) < Number(rangeBegin)) {
      return false;
    }

    return true;
  }

  /**
   * Tests if an existing ISSN range overlaps the range entered by user
   * @param {Object} range Range object given as user input
   * @param {Array} existingRanges List of ranges found in database
   * @returns true if there is overlap between existing range and range to be created, otherwise false
   */
  function rangeOverlapsExisting(range, existingRanges) {
    const formattedRange = formatRange(range);
    const formattedExistingRanges = existingRanges.map(v => formatRange(v));

    return formattedExistingRanges.some(v => hasOverlap(v, formattedRange));

    function hasOverlap(r1, r2) {
      return r1.block === r2.block && (testOverlap1(r1, r2) || testOverlap2(r1, r2));
    }

    function formatRange(r) {
      return {
        block: r.block,
        rangeBegin: Number(r.rangeBegin.slice(0, 3)),
        rangeEnd: Number(r.rangeEnd.slice(0, 3))
      };
    }
  }
  /* eslint-enable max-statements,functional/no-conditional-statements */

  /**
   * Deletes ISSN range based on identifier given as parameter. Range may be deleted if no identifiers
   * have been given from the range yet.
   * @param {number} id ISSN range id
   * @returns Range as JSON on success, ApiError on failure
   */
  async function remove(id) {
    const range = await issnRangeModelInterface.read(id);

    // Test whether there exists identifiers associated with range
    const usedIdentifiersCount = await issnUsedModel.count({where: {issnRangeId: id}});
    const canceledIdentifiersCount = await issnCanceledModel.count({where: {issnRangeId: id}});

    if (range.next !== range.rangeBegin) {
      throw new ApiError(HttpStatus.CONFLICT, 'Cannot delete range that has identifiers given from');
    }

    if (usedIdentifiersCount !== 0 || canceledIdentifiersCount !== 0) {
      throw new ApiError(HttpStatus.CONFLICT, 'Cannot delete range that has associations to either used or canceled identifiers');
    }

    // Delete range
    await range.destroy();

    return true;
  }

  /**
   * Reads all ISSN ranges from db.
   * @returns Array of ISSN ranges as JSON on success, ApiError on failure
   */
  async function readAll() {
    const result = await issnRangeModel.findAll();
    return result.map(v => v.toJSON());
  }

  /**
   * Opens closed ISSN range based on identifier given as parameter if there are available identifiers in range.
   * @param {number} id ISSN range id
   * @returns Range as JSON on success, ApiError on failure
   */
  async function open(id, user) {
    const range = await issnRangeModelInterface.read(id);

    // Check range is closed
    if (!range.isClosed) {
      throw new ApiError(HttpStatus.CONFLICT, 'Cannot open range that is already open');
    }

    // Verify there are available identifiers in range
    const canceledIdentifiers = await issnCanceledModel.findAndCountAll({where: {issnRangeId: id}});
    if (range.free === 0 && canceledIdentifiers.count === 0) {
      throw new ApiError(HttpStatus.CONFLICT, 'Cannot activate range that has not got any available identifiers');
    }

    // Update range
    const result = await range.update({isClosed: false, modifiedBy: user.id});
    return result.toJSON();
  }

  /**
   * Closes (and deactivates if not inactive already) open ISSN range based on identifier given as parameter.
   * @param {number} id ISSN range id
   * @returns Range as JSON on success, ApiError on failure
   */
  async function close(id, user) {
    const range = await issnRangeModelInterface.read(id);

    // Check if range is alread closed
    if (range.isClosed) {
      throw new ApiError(HttpStatus.CONFLICT, 'Cannot close range that is already closed');
    }

    // Update range
    const result = await range.update({isClosed: true, isActive: false, modifiedBy: user.id});
    return result.toJSON();
  }

  /**
   * Activates deactivated but open ISSN range based on identifier given as parameter if there are available identifiers in range.
   * @param {number} id ISSN range id
   * @returns Range as JSON on success, ApiError on failure
   */
  async function activate(id, user) {
    const t = await sequelize.transaction();
    try {
      const range = await issnRangeModelInterface.read(id, t);

      // Check if range is closed
      if (range.isClosed) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot activate range that is closed');
      }

      // Check if range is already active
      if (range.isActive) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot activate range that is already active');
      }

      // Verify there are available identifiers in range
      const canceledIdentifiersCount = await issnCanceledModel.count({where: {issnRangeId: id}, transaction: t});

      if (range.free === 0 && canceledIdentifiersCount === 0) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot activate range that has not got any available identifiers');
      }

      // Deactivate all other ranges
      await issnRangeModel.update({isActive: false, modifiedBy: user.id}, {where: {isActive: true}, transaction: t});

      // Update range to active
      const result = await range.update({isActive: true, modifiedBy: user.id}, {transaction: t});

      // Commit transaction
      await t.commit();
      return result.toJSON();

    } catch (err) {
      // Rollback transaction
      await t.rollback();
      throw err;
    }
  }

  /**
   * Deactivates open ISSN range based on identifier given as parameter.
   * @param {number} id ISSN range id
   * @returns Range as JSON on success, ApiError on failure
   */
  async function deactivate(id, user) {
    const range = await issnRangeModelInterface.read(id);

    // Check if range is already deactivated
    if (!range.isActive) {
      throw new ApiError(HttpStatus.CONFLICT, 'Cannot deactivate range that is already deactivated');
    }

    // Update range
    const result = await range.update({isActive: false, modifiedBy: user.id});
    return result.toJSON();
  }
}
