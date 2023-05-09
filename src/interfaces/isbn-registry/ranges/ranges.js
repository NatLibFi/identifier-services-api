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
import {createLogger} from '@natlibfi/melinda-backend-commons/dist/utils';

import sequelize from '../../../models';

import {ApiError} from '../../../utils';
import {formatPayloadCreateIsbnRange, formatPublisherIdentifierIsbn, isbnRangeOverlapsExisting} from './isbnUtils';
import {formatPayloadCreateIsmnRange, formatPublisherIdentifierIsmn, ismnRangeOverlapsExisting} from './ismnUtils';
import {publisherIdentifierBelongsToRange} from './genericUtils';
import {COMMON_IDENTIFIER_TYPES, ISBN_REGISTRY_ISBN_RANGE_LENGTH, ISBN_REGISTRY_ISMN_RANGE_LENGTH} from '../../constants';

import abstractModelInterface from '../../common/abstractModelInterface';

/**
 * Abstract range interface used for ISBN and ISMN ranges. Contains vast number of operations.
 * @param identifierType Type of identifiers to interact with (ISBN|ISMN)
 * @returns Interface to interact with ranges of chosen type
 */
/* eslint-disable max-lines */
export default function (identifierType) {
  const logger = createLogger();
  const {rangeModel, subRangeModel, subRangeCanceledModel, publisherModel} = getModels(identifierType);
  const rangeModelInterface = abstractModelInterface(rangeModel);
  const subRangeModelInterface = abstractModelInterface(subRangeModel);
  const subRangeCanceledModelInterface = abstractModelInterface(subRangeCanceledModel);
  const publisherModelInterface = abstractModelInterface(publisherModel);

  const IDENTIFIER_TYPE = identifierType;
  const RANGE_FK = getFK(identifierType);
  const SUBRANGE_PUBLISHER_ATTRIBUTE = getSubRangePublisherAttribute(identifierType);
  const RANGE_LENGTH = getRangeLength(identifierType);

  return {
    create,
    read: rangeModelInterface.readJSON,
    readAll,
    remove,
    activate,
    deactivate,
    close,
    open,
    generateSubrange,
    subrangeOptions
  };

  /**
   * Returns set of sequelize models required to interact with selected identifier type ranges and related entities
   * @param {string} identifierType Type of identifier (ISBN/ISMN)
   * @returns {Object} Object containing sequelize models required for range interface to work
   */
  function getModels(identifierType) {
    if (identifierType === COMMON_IDENTIFIER_TYPES.ISBN) {
      return {
        rangeModel: sequelize.models.isbnRange,
        subRangeModel: sequelize.models.isbnSubRange,
        subRangeCanceledModel: sequelize.models.isbnSubRangeCanceled,
        publisherModel: sequelize.models.publisherIsbn
      };
    }

    if (identifierType === COMMON_IDENTIFIER_TYPES.ISMN) {
      return {
        rangeModel: sequelize.models.ismnRange,
        subRangeModel: sequelize.models.ismnSubRange,
        subRangeCanceledModel: sequelize.models.ismnSubRangeCanceled,
        publisherModel: sequelize.models.publisherIsbn
      };
    }

    throw new Error('Identifier type error: range interface does not support defined identifier type');
  }

  /**
   * Get attribute name used as foreign key. Required because of the data model of previous software.
   * @param {string} identifierType Type of identifier (ISBN/ISMN)
   * @returns {string} FK attribute name as string
   */
  function getFK(identifierType) {
    if (identifierType === COMMON_IDENTIFIER_TYPES.ISBN) {
      return 'isbnRangeId';
    }

    if (identifierType === COMMON_IDENTIFIER_TYPES.ISMN) {
      return 'ismnRangeId';
    }

    throw new Error('Identifier type error: range interface does not support defined identifier type');
  }

  /**
   * Get attribute name used in publisher entity to represent active subrange of selected identifier type. Required because of the data model of previous software.
   * @param {string} identifierType Type of identifier (ISBN/ISMN)
   * @returns {string} Publisher active subrange attribute for the selected identifier type as string
   */
  function getSubRangePublisherAttribute(identifierType) {
    if (identifierType === COMMON_IDENTIFIER_TYPES.ISBN) {
      return 'activeIdentifierIsbn';
    }

    if (identifierType === COMMON_IDENTIFIER_TYPES.ISMN) {
      return 'activeIdentifierIsmn';
    }

    throw new Error('Identifier type error: range interface does not support defined identifier type');
  }

  /**
   * Get length of range for selected identifier type. Required because of the data model of previous software.
   * @param {string} identifierType Type of identifier (ISBN/ISMN)
   * @returns {number} Length attribute of the chosen identifier type used in calculating range/subrange category attribute
   */
  function getRangeLength(identifierType) {
    if (identifierType === COMMON_IDENTIFIER_TYPES.ISBN) {
      return ISBN_REGISTRY_ISBN_RANGE_LENGTH;
    }

    if (identifierType === COMMON_IDENTIFIER_TYPES.ISMN) {
      return ISBN_REGISTRY_ISMN_RANGE_LENGTH;
    }

    throw new Error('Identifier type error: range interface does not support defined identifier type');
  }

  /**
   * Creates a new identifier range and stores it to database
   * @param {Object} doc Document send as request
   * @param {Object} user User information
   * @returns Resulting database entry in JSON format if success. Throws ApiError on failure.
   */

  /* eslint-disable max-statements,functional/no-let,functional/no-conditional-statements */
  async function create(doc, user) {

    // Generate payload
    let dbDoc;

    // Payload generation function is dependent on range type
    if (IDENTIFIER_TYPE === COMMON_IDENTIFIER_TYPES.ISBN) {
      dbDoc = formatPayloadCreateIsbnRange(doc, user);
    } else if (IDENTIFIER_TYPE === COMMON_IDENTIFIER_TYPES.ISMN) {
      dbDoc = formatPayloadCreateIsmnRange(doc, user);
    } else {
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Problem in interface definition: unknown range type');
    }

    // Test whether range overlaps with some previously defined range
    const allRanges = await rangeModel.findAll({raw: true});

    // Test if any stored range overlaps newly creatable range, throw error if ranges overlap
    let rangeOverlapsExisting = true;
    if (IDENTIFIER_TYPE === COMMON_IDENTIFIER_TYPES.ISBN) {
      rangeOverlapsExisting = isbnRangeOverlapsExisting(dbDoc, allRanges);
    } else if (IDENTIFIER_TYPE === COMMON_IDENTIFIER_TYPES.ISMN) {
      rangeOverlapsExisting = ismnRangeOverlapsExisting(dbDoc, allRanges);
    }

    // Throw error if range overlaps existing
    if (rangeOverlapsExisting) {
      throw new ApiError(HttpStatus.CONFLICT, 'Cannot create new range as it would overlap existing range');
    }

    // Save to db
    const result = await rangeModel.create(dbDoc);
    return result.toJSON();
  }

  /**
   * Reads all ranges.
   * @returns Promise of array consisting of range objects
   */
  async function readAll() { // eslint-disable-line require-await
    const result = await rangeModel.findAll();
    return result.map(v => v.toJSON());
  }

  /**
   * Deletes a Range. Range can be deleted if no publisher ranges has been given from it.
   * @param {number} id Identifier of range to remove
   * @returns True if succeed, false on failure
   */
  async function remove(id) {

    // Search for range to be deleted
    const range = await rangeModel.findByPk(id);

    // Delete available only for ranges if no subranges have been yet given
    if (range.rangeBegin !== range.next) {
      throw new ApiError(HttpStatus.CONFLICT, 'Publisher ranges have already been given from the selected range, cannot delete.');
    }

    // Sanity check: no linked subranges should exist
    const linkedSubRangesCount = await subRangeModel.count({
      where: {
        [RANGE_FK]: range.id
      }
    });

    // If there exists publisher ranges linked to the range, it cannot be deleted
    if (linkedSubRangesCount > 0) {
      throw new ApiError(HttpStatus.CONFLICT, 'Publisher ranges linked to selected range could be found from database, cannot delete.');
    }

    // Remove range from db
    await range.destroy();

    return true;
  }

  /**
   * Activate range. To be activated range must have free publisher identifiers available.
   * @param {number} id Identifier of range to activate
   * @param {Object} user User making the request
   * @returns Updated range as JSON on success, ApiError on failure
   */
  async function activate(id, user) {
    const range = await rangeModelInterface.read(id);

    // To be re-activated, range must have free identifiers
    if (range.free === 0 && range.canceled === 0) {
      throw new ApiError(HttpStatus.CONFLICT, 'Cannot activate range which does not have free publisher identifiers available');
    }

    // Already active range should not be updated as should not if the range
    if (range.isActive) {
      throw new ApiError(HttpStatus.CONFLICT, 'Cannot activate range that is already active');
    }

    // Closed range needs to be opened before it can be activated
    if (range.isClosed) {
      throw new ApiError(HttpStatus.CONFLICT, 'Cannot activate range that is closed');
    }

    const rangeUpdateDoc = {
      isActive: true,
      isClosed: false,
      modifiedBy: user.id
    };

    // Update to db
    const result = await range.update(rangeUpdateDoc);
    return result.toJSON();
  }

  /**
  * Deactivate range. Note: does not close range.
  * @param {number} id Identifier of range to deactivate
  * @param {Object} user User making the request
  * @returns Updated range as JSON on success, ApiError on failure
  */
  async function deactivate(id, user) {
    const range = await rangeModelInterface.read(id);

    // Already deactivated range should not be updated
    if (!range.isActive) {
      throw new ApiError(HttpStatus.CONFLICT, 'Cannot activate range that is already active and not closed');
    }

    const rangeUpdateDoc = {
      isActive: false,
      modifiedBy: user.id
    };

    // Update to db
    const result = await range.update(rangeUpdateDoc);
    return result.toJSON();
  }

  /**
   * Close an active range.
   * @param {number} id Identifier of range to close
   * @param {Object} user User making the request
   * @returns Updated range as JSON on success, ApiError on failure
   */
  async function close(id, user) {
    const range = await rangeModelInterface.read(id);

    // Already closed range should not be updated
    if (range.isClosed) {
      throw new ApiError(HttpStatus.CONFLICT, 'Cannot close range that is already closed and not active');
    }

    const rangeUpdateDoc = {
      isActive: false,
      isClosed: true,
      modifiedBy: user.id
    };

    // Update to db
    const result = await range.update(rangeUpdateDoc);
    return result.toJSON();
  }

  /**
  * Open a closed range. Note: does not activate the range.
  * @param {number} id Identifier of range to open
  * @param {Object} user User making the request
  * @returns Updated range as JSON on success, ApiError on failure
  */
  async function open(id, user) {
    const range = await rangeModelInterface.read(id);

    // Already closed range should not be updated
    if (!range.isClosed) {
      throw new ApiError(HttpStatus.CONFLICT, 'Cannot open range that is already open');
    }

    // Range can be opened only if there are subranges that can be generated from it
    if (range.free === 0 && range.canceled === 0) {
      throw new ApiError(HttpStatus.CONFLICT, 'Cannot open range that does not have available subranges');
    }

    const updatedRange = {
      isClosed: false,
      modifiedBy: user.id
    };

    // Update to db
    const result = await range.update(updatedRange);
    return result.toJSON();
  }

  /**
  * Generates new publisher identifier from the given identifier range and assigns it to the given publisher.
  * @param {Object} options Options used for generating the publisher identifier
  * @param {Object} user User initiating the job
  * @returns Generated publisher identifier on success, ApiError on failure
  */
  /* eslint-disable complexity,max-statements,max-depth,functional/no-let,functional/no-conditional-statements,
  functional/immutable-data,functional/no-loop-statements*/
  async function generateSubrange({rangeId, publisherId, selectedPublisherIdentifier}, user) {

    // Start transaction
    const t = await sequelize.transaction();

    try {
      // Get range
      const range = await rangeModelInterface.read(rangeId, t);

      // Verify publisher exists
      const publisher = await publisherModelInterface.read(publisherId, t);

      // Cannot generate subrange from closed range
      if (range.isClosed) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot generate subrange from closed range');
      }

      // Cannot generate subrange from inactive range
      if (!range.isActive) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot generate subrange from inactive range');
      }

      // Cannot generate subrange to publisher who has quitted
      if (publisher.hasQuitted) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot generate subrange for publisher who has quit publishing');
      }

      // Initialize check whether selection considers canceled publisher identifier.
      // Canceled options are prefixed with "can_" after which id from canceled table is considered
      const canceled = selectedPublisherIdentifier !== null && selectedPublisherIdentifier.indexOf('can_') !== -1;
      const canceledId = canceled ? selectedPublisherIdentifier.replace('can_', '') : null;

      // Initialize result to memory
      let result;

      // In case selected publisher identifier was from canceled publisher identifiers
      if (canceled) {
        logger.info('Subrange will be created from previously canceled publisher identifier');

        // Find canceled identifier based on id given in option
        const canceledIdentifier = await subRangeCanceledModelInterface.read(canceledId, t);

        // Should fail if canceled identifier does not belong to selected range ID
        if (canceledIdentifier.rangeId !== range.id) {
          throw new ApiError(HttpStatus.CONFLICT, 'Selected canceled identifier does not belong to selected range');
        }

        // Sanity check: Canceled identifier is not in use already due to an accident
        // Get all publisher identifiers
        const used = await subRangeModel.findAll({
          where: {
            [RANGE_FK]: range.id
          },
          transaction: t
        });

        // Format identifiers
        const usedFormatted = used.map(v => v.toJSON()).map(({publisherIdentifier, ...rest}) => publisherIdentifier); // eslint-disable-line no-unused-vars

        // Verify identifier is not in use already
        if (usedFormatted.includes(canceledIdentifier.identifier)) {
          throw new ApiError(HttpStatus.CONFLICT, 'Selected publisher identifier is already in use. Please contact system administrator.');
        }

        // Delete canceled identifier from canceled table
        await canceledIdentifier.destroy({transaction: t});

        // Decrease canceled from range where canceled identifier was taken
        // Sanity check, range must have enought canceled identifiers to decrease
        if (range.canceled - 1 < 0) {
          throw new ApiError(HttpStatus.CONFLICT, 'Cannot decrease canceled since range canceled value would be a negative number');
        }

        const rangeUpdateDoc = {
          canceled: range.canceled - 1,
          modifiedBy: user.id
        };

        // Close range if there are no more free publisher identifiers
        if (range.free === 0 && rangeUpdateDoc.canceled === 0) {
          rangeUpdateDoc.isActive = false;
          rangeUpdateDoc.isClosed = true;
        }

        // Update to db
        await range.update(rangeUpdateDoc, {transaction: t});

        // Resulting identifier is the canceled identifier that was selected
        result = canceledIdentifier.identifier;
      } else {
        const publisherIdentifier = selectedPublisherIdentifier;

        // Check identifier availability based on other identifiers in range
        const used = await subRangeModel.findAll({
          where: {
            [RANGE_FK]: range.id
          },
          transaction: t
        });
        const usedFormatted = used.map(v => v.toJSON()).map(({publisherIdentifier, ...rest}) => publisherIdentifier); // eslint-disable-line no-unused-vars

        // Check identifier is not used in identifier table
        if (!_checkAvailability(publisherIdentifier, range, usedFormatted)) {
          throw new ApiError(HttpStatus.CONFLICT, 'Selected publisher identifier is not available');
        }

        // Check identifier availability based on canceled entries of range
        const usedCanceled = await subRangeCanceledModel.findAll({
          where: {
            rangeId: range.id
          },
          transaction: t
        });
        const usedCanceledFormatted = usedCanceled.map(v => v.toJSON()).map(({identifier, ...rest}) => identifier); // eslint-disable-line no-unused-vars

        // Check identifier is not used in ranges canceled identifier table
        if (!_checkAvailability(publisherIdentifier, range, usedCanceledFormatted)) {
          throw new ApiError(HttpStatus.CONFLICT, 'Selected publisher identifier is only available through using similar canceled identifier');
        }

        // Increase range next pointer if chose the current next value
        // Value is updated directly to range.next attribute
        if (publisherIdentifier === range.next) {
          range.next = String(Number(range.next) + 1).padStart(range.category, '0');

          while (!_checkAvailability(range.next, range, usedFormatted) &&
            Number(range.next) < Number(range.rangeEnd) + 2) {
            range.next = String(Number(range.next) + 1).padStart(range.category, '0');
          }
        }


        // Increment range counters
        const rangeUpdateDoc = {
          free: range.free - 1,
          taken: range.taken + 1,
          next: range.next,
          isActive: !(range.free - 1 === 0 && range.canceled === 0),
          isClosed: Boolean(range.free - 1 === 0 && range.canceled === 0),
          modifiedBy: user.id
        };

        // Update to db
        await range.update(rangeUpdateDoc, {transaction: t});

        result = _formatPublisherIdentifier(range, publisherIdentifier);
      }

      // Sanity check: verify resulting identifier belongs to selected range
      if (!publisherIdentifierBelongsToRange(result, range, IDENTIFIER_TYPE)) {
        throw new ApiError(HttpStatus.CONFLICT, 'Selected identifier does not belong to selected range. Refusing to create publisher identifier for publisher.');
      }

      // Deactivate publisher's other subranges as newly created subrange will become the only active
      // Get all publisher SubRanges
      const publisherSubRanges = await subRangeModel.findAll({
        where: {
          publisherId
        },
        transaction: t
      });

      // Update deactivation to all found subranges that are active
      await Promise.all(publisherSubRanges.filter(v => v.isActive).map(v => v.update({isActive: false, modifiedBy: user.id}, {transaction: t})));

      // Create publisher identifier and update active identifier info
      const category = RANGE_LENGTH - range.category;
      const rangeBegin = ''.padStart(category, '0');
      const rangeEnd = ''.padStart(category, '9');

      const dbDoc = {
        [RANGE_FK]: range.id,
        publisherId: publisher.id,
        publisherIdentifier: result,
        category,
        isActive: true,
        isClosed: false,
        rangeBegin,
        rangeEnd,
        free: Number(rangeEnd) - Number(rangeBegin) + 1,
        taken: 0,
        canceled: 0,
        deleted: 0,
        next: rangeBegin,
        createdBy: user.id,
        modifiedBy: user.id
      };

      const databaseCreateResult = await subRangeModelInterface.create(dbDoc, t);

      // Update active subrange information to publisher entity
      const publisherUpdate = {[SUBRANGE_PUBLISHER_ATTRIBUTE]: result, modifiedBy: user.id};
      await publisher.update(publisherUpdate, {transaction: t});

      // Commit transaction
      await t.commit();

      // Return result
      return databaseCreateResult;
    } catch (err) {
      logger.info('Creationg of subrange was not successful due to an error. Attempting transaction rollback.');
      await t.rollback();

      logger.info('Transaction rollback was successful');
      throw err;
    }
  }
  /* eslint-enable complexity,max-statements,max-depth,functional/no-let,functional/no-conditional-statements */

  /**
   * Generates options for creating new subrange for publisher. Options consist of publisher identifiers within the selected range
   * that cannot be found from the subrange table and publisher identifiers that can be found from canceled subranges table.
   * @param {number} rangeId ID of range to generate options for
   * @returns Array of subranges. Canceled subranges are prefixed with 'can_<id>' and newly generateable subranges are returned in publisher identifier format.
   */
  async function subrangeOptions(rangeId) {

    // Find range for which generate available free subrange options
    const range = await rangeModelInterface.read(rangeId);

    // Closed or inactive ranges have no available subrange options
    if (range.isClosed || !range.isActive) {
      throw new ApiError(HttpStatus.CONFLICT, 'Won\'t generate options for range that is either closed or deactivated');
    }

    // Generate all valid subrange values based on range start and end
    const rangeSubrangeIdentifiers = Array(Number(range.rangeEnd) - Number(range.rangeBegin) + 1)
      .fill()
      .map((_, i) => i + Number(range.rangeBegin))
      .map(v => String(v).padStart(range.category, '0'));

    // Get taken subranges associated with range
    const takenSubranges = await subRangeModel.findAll({
      where: {
        [RANGE_FK]: range.id
      }
    });

    // Get canceled subranges associated with range
    const canceledSubranges = await subRangeCanceledModel.findAll({
      where: {
        rangeId: range.id
      }
    });

    // Filter taken and canceled subranges
    const availableSubranges = rangeSubrangeIdentifiers
      .filter(v => !takenSubranges.map(sr => sr.publisherIdentifier).includes(_formatPublisherIdentifier(range, v)))
      .filter(v => !canceledSubranges.map(sr => sr.identifier).includes(_formatPublisherIdentifier(range, v)));

    // Return set of available subranges which consist of both non-taken and canceled subranges
    return [
      ...availableSubranges.map(v => ({value: `${v}`, identifier: _formatPublisherIdentifier(range, v)})),
      ...canceledSubranges.map(v => ({value: `can_${v.id}`, identifier: v.identifier}))
    ];
  }

  /**
   * Tests whether the identifier formatted using range (both given as parameter) is found in the used identifiers array given as third parameter
   * @param {string} identifier Identifier to check
   * @param {Object} range Range used for constructing the formatted identifier
   * @param {Array} used Array of used identifiers of the range
   * @returns {boolean} True if the identifier is already in use, otherwise false
   */
  function _checkAvailability(identifier, range, used) {
    const formattedIdentifier = _formatPublisherIdentifier(range, identifier);
    return !used.includes(formattedIdentifier);
  }

  /**
   * Wrapper for formatting publisher identifier from range and identifier parts
   * @param {Object} range Range object
   * @param {string} identifier Identifier string
   * @returns Formatted publisher identifier (ISBN or ISMN)
   */
  function _formatPublisherIdentifier(range, identifier) {
    if (IDENTIFIER_TYPE === COMMON_IDENTIFIER_TYPES.ISBN) {
      return formatPublisherIdentifierIsbn(range, identifier);
    } else if (IDENTIFIER_TYPE === COMMON_IDENTIFIER_TYPES.ISMN) {
      return formatPublisherIdentifierIsmn(range, identifier);
    }

    throw new Error('Unsupported identifier type');
  }
}
