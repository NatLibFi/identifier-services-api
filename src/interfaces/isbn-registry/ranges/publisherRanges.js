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
import {Op} from 'sequelize';

import sequelize from '../../../models';
import {ApiError} from '../../../utils';

import identifiersFactory from '../identifiers';

import {COMMON_IDENTIFIER_TYPES, ISBN_REGISTRY_PUBLICATION_PRINT_TYPES, ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES, ISBN_REGISTRY_PUBLICATION_TYPES, ISBN_REGISTRY_FORMATS} from '../../constants';
import {formatPublisherIdentifierIsbn, calculateCheckDigitIsbn, isValidIdentifier} from './isbnUtils';
import {formatPublisherIdentifierIsmn} from './ismnUtils';
import abstractModelInterface from '../../common/abstractModelInterface';

/**
 * Abstract publisher range interface. Contains CRUD operations and a number of helper functions.
 * @param identifierType Type of identifiers to interact with (ISBN|ISMN)
 * @returns Interface to interact with publisher ranges (i.e. subranges)
 */
/* eslint-disable max-lines */
export default function (identifierType) {
  // Validate identifier type before initialization of interface
  validateIdentifierType(identifierType);

  const {rangeModel, subRangeModel, subRangeCanceledModel, publisherModel} = getModels(identifierType);
  const rangeModelInterface = abstractModelInterface(rangeModel);
  const subRangeModelInterface = abstractModelInterface(subRangeModel);
  const subRangeCanceledModelInterface = abstractModelInterface(subRangeCanceledModel);
  const publisherModelInterface = abstractModelInterface(publisherModel);

  const IDENTIFIER_TYPE = identifierType;
  const SUBRANGE_PUBLISHER_ATTRIBUTE = getSubRangePublisherAttribute(identifierType);
  const RANGE_FK = getRangeFK(identifierType);
  const IDENTIFIER_VAR_TOTAL_LENGTH = getIdentifierVarTotalLength(identifierType);

  // Shared models between ISBN and ISMN subranges
  const identifierBatchModel = sequelize.models.identifierBatch;
  const identifierModel = sequelize.models.identifier;
  const identifierCanceledModel = sequelize.models.identifierCanceled;
  const publicationIsbnModel = sequelize.models.publicationIsbn;

  const publicationIsbnModelInterface = abstractModelInterface(publicationIsbnModel);
  const identifierBatchModelInterface = abstractModelInterface(identifierBatchModel);

  // Identifier interface
  const identifierInterface = identifiersFactory();

  return {
    read: subRangeModelInterface.readJSON,
    activate,
    deactivate,
    close,
    open,
    remove,
    generateIdentifierBatchWrapper
  };

  /**
   * Validates identifier type for the interface.
   * @param {string} identifierType Chosen identifier type
   */
  function validateIdentifierType(identifierType) {
    const validIdentifierTypes = [COMMON_IDENTIFIER_TYPES.ISBN, COMMON_IDENTIFIER_TYPES.ISMN];

    if (validIdentifierTypes.includes(identifierType)) {
      return;
    }

    throw new Error(`Interface does not support selected identifierType: ${identifierType}`);
  }

  /**
   * Retrieves models for interface to interact based on identifier type
   * @param {string} identifierType Type of identifier subranges to manage
   * @returns Object containing sequelize models
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

    return {};
  }

  /**
   * Returns publisher attribute that considers subrange type based on identifier type given as parameter.
   * @param {string} identifierType Type of identifiers considered by the interface
   * @returns Publisher subrange attribute name as string
   */
  function getSubRangePublisherAttribute(identifierType) {
    if (identifierType === COMMON_IDENTIFIER_TYPES.ISBN) {
      return 'activeIdentifierIsbn';
    }

    if (identifierType === COMMON_IDENTIFIER_TYPES.ISMN) {
      return 'activeIdentifierIsmn';
    }

    return {};
  }

  /**
   * Returns publisher attribute that considers subrange foreign key based on identifier type given as parameter.
   * @param {string} identifierType Type of identifiers considered by the interface
   * @returns Publisher subrange FK attribute name as string
   */
  function getRangeFK(identifierType) {
    if (identifierType === COMMON_IDENTIFIER_TYPES.ISBN) {
      return 'isbnRangeId';
    }

    if (identifierType === COMMON_IDENTIFIER_TYPES.ISMN) {
      return 'ismnRangeId';
    }

    return {};
  }

  /**
   * Returns identifier portion length of subrange type given as parameter.
   * @param {string} identifierType Type of identifiers considered by the interface
   * @returns Identifier part length as integer
   */
  function getIdentifierVarTotalLength(identifierType) {
    if (identifierType === COMMON_IDENTIFIER_TYPES.ISBN) {
      return 6;
    }

    if (identifierType === COMMON_IDENTIFIER_TYPES.ISMN) {
      return 8;
    }

  }

  /**
   * Activate subrange. To be activated range must have free identifiers available.
   * Activating subrange deactivates other subranges from the publisher.
   * @param {number} id Identifier of subrange to activate
   * @param {Object} user User making the request
   * @param {Object} transaction Sequelize transaction object. Required for identifier generation.
   * @returns Updated subrange as JSON on success, ApiError on failure
   */
  /* eslint-disable functional/no-conditional-statements,max-statements,max-depth */
  async function activate(id, user, transaction = false) {
    // Create transaction if it does not exist
    const t = transaction || await sequelize.transaction();

    try {
      // Create scoped query options
      const subrange = await subRangeModel.findByPk(id, {transaction: t});

      if (subrange) {
        // Find publisher
        const publisher = await publisherModelInterface.read(subrange.publisherId, t);

        // To be re-activated, subrange must have free identifiers
        if (subrange.free === 0 && subrange.canceled === 0) {
          throw new ApiError(HttpStatus.CONFLICT, 'Cannot activate subrange which does not have free publisher identifiers available');
        }

        // Already active subrange should not be updated
        if (subrange.isActive) {
          throw new ApiError(HttpStatus.CONFLICT, 'Cannot activate subrange that is already active');
        }

        // Closed subranges cannot be activated
        if (subrange.isClosed) {
          throw new ApiError(HttpStatus.CONFLICT, 'Cannot activate subrange that has been closed');
        }

        // Get all publisher SubRanges
        const publisherSubRanges = await subRangeModel.findAll({
          where: {
            publisherId: publisher.id,
            isActive: true
          },
          transaction: t
        });

        // Update deactivation to all found subranges that are active
        await Promise.all(publisherSubRanges.map(v => v.update({isActive: false, modifiedBy: user.id}, {transaction: t})));

        // Update active subrange to publisher
        await publisher.update({[SUBRANGE_PUBLISHER_ATTRIBUTE]: subrange.publisherIdentifier, modifiedBy: user.id}, {transaction: t});

        // Update subrange
        const result = await subrange.update({isActive: true, modifiedBy: user.id}, {transaction: t});

        // Commit transaction if it was declared in this scope
        if (!transaction) {
          await t.commit();
        }

        // Return result of update
        return result.toJSON();
      }
      throw new ApiError(HttpStatus.NOT_FOUND);
    } catch (err) {
      // Rollback transaction if it was declared in this scope
      if (!transaction) {
        await t.rollback();
      }

      throw err;
    }
  }
  /* eslint-enable functional/no-conditional-statements,max-statements,max-depth */


  /**
   * Deactivate subrange.
   * @param {number} id Identifier of subrange to deactivate
   * @param {Object} user User making the request
   * @returns Updated subrange as JSON on success, ApiError on failure
   */
  async function deactivate(id, user) {
    // Start transaction
    const t = await sequelize.transaction();
    try {

      const subrange = await subRangeModelInterface.read(id);
      const publisher = await publisherModelInterface.read(subrange.publisherId);

      // Already deactivated range should not be updated
      if (!subrange.isActive) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot deactivate range that is already deactivated');
      }

      // Update publisher
      await publisher.update({[SUBRANGE_PUBLISHER_ATTRIBUTE]: '', modifiedBy: user.id}, {transaction: t});

      // Update subrange
      const result = await subrange.update({isActive: false, modifiedBy: user.id}, {transaction: t});

      // Commit transaction
      await t.commit();

      // Return result
      return result.toJSON();
    } catch (err) {
      // Rollback transaction
      await t.rollback();

      // Throw error upwards
      throw err;
    }
  }

  /**
  * Close subrange.
  * @param {number} id Identifier of subrange to close
  * @param {Object} user User making the request
  * @returns Updated range as JSON on success, ApiError on failure
  */
  // eslint-disable-next-line max-statements
  async function close(id, user) {
    // Start transaction
    const t = await sequelize.transaction();

    try {

      const subrange = await subRangeModelInterface.read(id, t);
      const publisher = await publisherModelInterface.read(subrange.publisherId, t);

      // Already closed range should not be updated
      if (subrange.isClosed) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot deactivate range that is already closed');
      }

      // If SubRange was active, update publisher subrange attribute to empty
      // eslint-disable-next-line functional/no-conditional-statements
      if (subrange.isActive) {
        await publisher.update({[SUBRANGE_PUBLISHER_ATTRIBUTE]: '', modifiedBy: user.id}, {transaction: t});
      }

      // Update subrange
      const result = await subrange.update({isActive: false, isClosed: true, modifiedBy: user.id}, {transaction: t});

      // Commit transaction
      await t.commit();

      // Return result
      return result.toJSON();
    } catch (err) {
      // Rollback transaction
      await t.rollback();

      // Throw error upwards
      throw err;
    }
  }

  /**
  * Open subrange. Note: this does not automatically activate subrange.
  * @param {number} id Identifier of subrange to open
  * @param {Object} user User making the request
  * @returns Updated subrange as JSON on success, ApiError on failure
  */
  /* eslint-disable functional/no-conditional-statements,max-depth,max-statements */
  async function open(id, user) {
    const t = await sequelize.transaction();
    try {

      const subrange = await subRangeModelInterface.read(id, t);

      // Already closed range should not be updated
      if (!subrange.isClosed) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot re-open subrange that is already open');
      }

      // Subrange needs to have free or canceled identifiers in order to be re-opened
      if (subrange.free === 0 && subrange.canceled === 0) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot re-open subrange that does not have available identifiers');
      }

      // Update subrange
      const result = await subrange.update({isClosed: false, modifiedBy: user.id}, {transaction: t});

      // Commit transaction
      await t.commit();

      // Return result
      return result.toJSON();
    } catch (err) {
      // Rollback transaction
      await t.rollback();

      // Throw error upwards
      throw err;
    }
  }
  /* eslint-enable functional/no-conditional-statements,max-depth,max-statements */


  /**
   * Cancels publisher range. Publisher range can be canceled if there are no associations to it and it was last given subrange from its associated range.
   * All subranges that are cancelled are reusable. If publisher range contains canceled identifiers in canceled identifiers table, these are removed.
   * @param {number} id ID of publisher range to cancel
   * @param {Object} user User invoking publisher range cancellation
   * @returns True if succeed, ApiError on failure
   */
  /* eslint-disable max-depth,max-statements */
  async function remove(id, user) {
    const t = await sequelize.transaction();

    try {

      // Search for subrange to be deleted and associated range
      const subrange = await subRangeModelInterface.read(id, t);
      const range = await rangeModelInterface.read(subrange[RANGE_FK], t);

      // Test whether subrange can be deleted
      const canBeDeleted = await _canDeleteSubRange(subrange.id);

      if (!canBeDeleted) {
        throw new ApiError(HttpStatus.CONFLICT, 'Identifiers have already been given from subrange, cannot delete.');
      }

      // Test whether subrange can be canceled by decreasing range pointers or if it should be moved to
      // canceled subranges table
      // eslint-disable-next-line functional/no-conditional-statements
      if (_previousRangeModelDeleteTest(range, subrange.publisherIdentifier)) {
        // Update range counters and next value
        const rangeUpdateDoc = {
          free: range.free + 1,
          taken: range.taken - 1,
          next: String(Number(range.next) - 1).padStart(range.category, '0'),
          modifiedBy: user.id
        };
        await range.update(rangeUpdateDoc, {transaction: t});
      } else { // eslint-disable-line functional/no-conditional-statements
        // Place identifier to cancelled identifiers table
        const canceledSubRange = {
          identifier: subrange.publisherIdentifier,
          category: IDENTIFIER_VAR_TOTAL_LENGTH - subrange.category,
          rangeId: subrange[RANGE_FK],
          canceledBy: user.id
        };

        await subRangeCanceledModelInterface.create(canceledSubRange, t);

        // Update associated range canceled counter
        const rangeUpdateDoc = {
          canceled: range.canceled + 1,
          modifiedBy: user.id
        };

        await range.update(rangeUpdateDoc, {transaction: t});
      }

      if (subrange.canceled > 0) {
        // Delete canceled identifiers that need to be deleted
        const canceledIdentifierDestroyResult = await subRangeCanceledModel.destroy({
          where: {
            identifierType: IDENTIFIER_TYPE,
            subRangeId: subrange.id
          },
          transaction: t
        });

        if (canceledIdentifierDestroyResult !== subrange.canceled) {
          throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Error in removing canceled identifiers during subrange removal');
        }
      }

      // Update active subrange information to publisher entity if needed
      const publisher = await publisherModelInterface.read(subrange.publisherId, t);

      // eslint-disable-next-line functional/no-conditional-statements
      if (publisher[SUBRANGE_PUBLISHER_ATTRIBUTE] === subrange.publisherIdentifier) {
        await publisher.update({[SUBRANGE_PUBLISHER_ATTRIBUTE]: '', modifiedBy: user.id}, {transaction: t});
      }

      // Remove subrange
      await subrange.destroy({transaction: t});

      // Commit transaction
      await t.commit();

      // Return true since the process was successful
      return true;
    } catch (err) {
      // Rollback transaction
      await t.rollback();

      // Throw error upwards
      throw err;
    }

    /**
     * Tests whether deletion is valid similar to what was used in previous
     * version of identifier services software.
     * @param {Object} range Range which publisher identifier was given from
     * @param {string} publisherIdentifier Publisher identifier which deletion to test for
     * @returns {boolean} True if deletion is valid, otherwise false
     */
    /* eslint-disable functional/no-conditional-statements, functional/no-let */
    function _previousRangeModelDeleteTest(range, publisherIdentifier) {
      // Create identifier from previous value of next pointer
      // If it matches the identifier we can verify deletion via decreasing pointer is ok.
      const previousIdentifier = String(Number(range.next) - 1).padStart(range.category, '0');
      let formattedPreviousIdentifier;

      if (IDENTIFIER_TYPE === COMMON_IDENTIFIER_TYPES.ISBN) {
        formattedPreviousIdentifier = formatPublisherIdentifierIsbn(range, previousIdentifier);
      } else if (IDENTIFIER_TYPE === COMMON_IDENTIFIER_TYPES.ISMN) {
        formattedPreviousIdentifier = formatPublisherIdentifierIsmn(range, previousIdentifier);
      } else {
        throw new Error('Error in resolving whether subrange can be deleted: Unsupported identifier type');
      }

      if (formattedPreviousIdentifier === publisherIdentifier) {
        return true;
      }

      return false;
    }
    /* eslint-enable functional/no-conditional-statements, functional/no-let */
  }
  /* eslint-enable max-depth */

  /**
 * Function to test whether publisher range can be deleted. Publisher range may be deleted if
 * it passes the previous deletion test and in addition no identifiers, canceled identifiers or identifierbatches cannot
 * be found to be linked to publisher identifier.
 * @param {string} subRangeId Id of Subrange to validate deletion for
 * @returns {boolean} True if subrange can be deleted, False if subrange cannot be deleted
 */
  /* eslint-disable functional/no-let,functional/no-conditional-statements */
  async function _canDeleteSubRange(subRangeId) {
    const subRange = await subRangeModelInterface.read(subRangeId);

    // Do previous test for delete validity, if they dont pass, cannot delete subrange
    if (!_previousSubRangeDeleteTest(subRange)) {
      return false;
    }

    // If subrange has any non-cancelled associations, it cannot be deleted whatever counters might say
    const identifiers = await identifierModel.findAll({
      where: {
        identifier: {
          [Op.like]: `${subRange.publisherIdentifier}%`
        },
        subRangeId: subRange.id
      }
    });

    const batches = await identifierBatchModel.findAll({
      where: {
        identifierType: IDENTIFIER_TYPE,
        subRangeId: subRange.id
      }
    });

    const associations = [...identifiers, ...batches];

    if (associations.length > 0) {
      return false;
    }

    // Previous test tests whether taken === canceled. Verify canceled count is reliable.
    const canceledIdentifiersCount = await identifierCanceledModel.count({where: {subRangeId: subRange.id}});
    if (subRange.canceled !== canceledIdentifiersCount) {
      return false;
    }

    return true;

    /**
   * Tests whether the next value of subrange is the begin of subrange or whether all given identifiers
   * have been canceled and thus suitable for reuse
   * @param {Object} subRange Subrange to test
   * @returns True if subrange can be removed, otherwise false
   */
    function _previousSubRangeDeleteTest(subRange) {
      if (subRange.rangeBegin === subRange.next) {
        return true;
      } else if (subRange.taken === subRange.canceled && subRange.deleted === 0) {
        return true;
      }
      return false;
    }
  }

  /**
   * Wrapper function for generating a new identifier batch consisting of new identifiers.
   * @param {number} publisherId Publisher id to generate the identifiers for
   * @param {number} count Number of identifiers to generate (if generating batch without associating identifiers with publication)
   * @param {number} publicationId Publication id to generate identifiers for (if generating batch associated with publication)
   * @param {Object} user User generating the identifiers
   * @returns {Object} Generated identifier batch if generation was successfull, otherwise throws instance of ApiError
   */
  async function generateIdentifierBatchWrapper(publisherId, count, publicationId = 0, user) { // eslint-disable-line default-param-last
    // Start transaction. Transaction is started here in the wrapper as the recursive function needs to use same transaction until it exists.
    const t = await sequelize.transaction();
    try {
      // At this point of time 10k identifiers is identifier batch limit due to memory issues.
      // If 100k batches are required, it can be achieved via creating 10k batch ten times
      if (count > 10000) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot create identifierbatch this large: maximum identifiers to be created is 10000');
      }

      // This is perhaps one of the most important functions of the isbn-registry API codebase.
      // It generates set of identifiers from one or two publisher ranges by utilizing recursion.
      const result = await generateIdentifierBatch(publisherId, count, publicationId, user, t);

      // Commit transaction
      await t.commit();

      // Return resulting identifier batch
      return result;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
 * Creates an identifier batch and links identifiers to publication if id is given.
 * @param {number} publisherId Id of publisher to make identifier batch for
 * @param {number} count Number of identifiers to produce (if producing identifier list not associated with any publication)
 * @param {number} publicationId Publication to associate the identifiers with
 * @param {Object} user User initiating the request
 * @param {Object} t Transaction to be used for database operations.
 * @param {boolean} useCanceledFromAnyRange Defines if canceled identifiers from any publisher's range sharing category may be used. If false, only canceled identifiers from active range are used.
 * @returns {Object} Generated identifier batch if generation was successfull, otherwise throws instance of ApiError
 */
  /* eslint-disable complexity,max-params,max-statements,max-depth,functional/no-let,functional/no-conditional-statements,functional/no-loop-statements,functional/immutable-data */
  async function generateIdentifierBatch(publisherId, count, publicationId, user, t, useCanceledFromAnyRange = false) {
    // Test that either only count or publicationId is defined
    if (count && publicationId) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'If publication is defined for identifier batch generation, cannot define count');
    }

    const publisher = await publisherModelInterface.read(publisherId, t);
    const results = {};
    let publication;
    let publicationTypes = [];
    let publicationTypeIdx = 0;

    // Cannot generate identifiers for publisher that has quitted
    if (publisher.hasQuitted) {
      throw new ApiError(HttpStatus.CONFLICT, 'Cannot create identifiers for publisher that has quitted');
    }

    // Gather valid subranges depending on identifier type
    let publisherSubRanges;

    if (IDENTIFIER_TYPE === COMMON_IDENTIFIER_TYPES.ISBN) {
      publisherSubRanges = await publisher.getIsbnSubRanges({transaction: t});
    } else if (IDENTIFIER_TYPE === COMMON_IDENTIFIER_TYPES.ISMN) {
      publisherSubRanges = await publisher.getIsmnSubRanges({transaction: t});
    } else {
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Error in generating identifier batch: Unsupported identifier type');
    }

    // Cannot create identifiers if publisher has no subranges for the defined identifier type
    if (!publisherSubRanges || publisherSubRanges.length === 0) {
      throw new ApiError(HttpStatus.CONFLICT, 'Cannot create identifiers for publisher that does not have publisher ranges of selected type');
    }

    // Find active subrange of publisher
    const activePublisherSubrange = publisherSubRanges.find(sr => sr.publisherIdentifier === publisher[SUBRANGE_PUBLISHER_ATTRIBUTE] && sr.isActive && !sr.isClosed);
    if (activePublisherSubrange === undefined) {
      throw new ApiError(HttpStatus.CONFLICT, 'Publisher does not have active publisher range which is active and not closed. Please set active publisher range for publisher before generating identifiers.');
    }

    // Get publication information for assigning identifiers to different formats
    if (publicationId) {
      publication = await publicationIsbnModelInterface.read(publicationId, t);

      // Sanity checks regarding publication and its validity for having new set of identifiers generated
      if (publication.publicationIdentifierPrint !== '' || publication.publicationIdentifierElectronical !== '') {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot generate identifiers for publication that already has identifiers defined');
      }

      if (!publication.publicationFormat || publication.publicationFormat === '') {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot generate identifiers for publication without defined format');
      }

      if (publication.publisherId !== publisherId) {
        throw new ApiError(HttpStatus.CONFLICT, 'Selected publication does not belong to defined publisher');
      }

      if (publication.noIdentifierGranted) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot generate identifiers for publication that has had its application denied');
      }

      if (publication.publicationsPublic === false || publication.publicationsIntra === true) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot generate identifiers for publication that is either not public or defined only for intra use');
      }

      // Only sheet music can have ISMN identifiers generated
      if (IDENTIFIER_TYPE === COMMON_IDENTIFIER_TYPES.ISMN && publication.publicationType !== ISBN_REGISTRY_PUBLICATION_TYPES.SHEET_MUSIC) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot generate ISMN identifiers for publication that is not sheet music');
      }

      // If publication is sheet music, it cannot have ISBN identifiers generated
      if (IDENTIFIER_TYPE === COMMON_IDENTIFIER_TYPES.ISBN && publication.publicationType === ISBN_REGISTRY_PUBLICATION_TYPES.SHEET_MUSIC) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot generate ISBN identifiers for sheet music');
      }

      // Sanity check that type of fileformat is defined
      if (publication.type === null && publication.fileformat === null) {
        throw new Error('Incompatible type data, cannot generate identifiers for publication');
      }

      // Database holds empty strings and may hold nulls, but sequelize virtual getter should take care of this
      const printTypes = publication.type;
      const electronicalTypes = publication.fileformat;

      // Sanity checks regarding publication format and type definitions
      if (publication.publicationFormat === ISBN_REGISTRY_FORMATS.PRINT) {
        if (printTypes.length === 0 || electronicalTypes.length > 0) {
          throw new ApiError(HttpStatus.CONFLICT, 'Conflict in publication format and type definitions');
        }
      } else if (publication.publicationFormat === ISBN_REGISTRY_FORMATS.ELECTRONICAL) {
        if (printTypes.length > 0 || electronicalTypes.length === 0) {
          throw new ApiError(HttpStatus.CONFLICT, 'Conflict in publication format and type definitions');
        }
      } else if (publication.publicationFormat === ISBN_REGISTRY_FORMATS.PRINT_ELECTRONICAL) {
        if (printTypes.length === 0 || electronicalTypes.length === 0) {
          throw new ApiError(HttpStatus.CONFLICT, 'Conflict in publication format and type definitions');
        }
      } else {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot generate identifiers for unsupported publication format value');
      }

      publicationTypes = [...printTypes, ...electronicalTypes];

      // Verify the count of publication types is not zero
      if (publicationTypes.length === 0) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot generate identifiers for publication that does not have any type or fileformat definitions');
      }
    }

    // Prioritize usage of canceled identifiers from the active range
    const canceledIdentifierSearchSubranges = useCanceledFromAnyRange ? await subRangeModel.findAll({where: {publisherId, category: activePublisherSubrange.category}, transaction: t}) : [activePublisherSubrange];
    const canceledIdentifiers = await await identifierCanceledModel.findAll({
      where: {
        identifierType: IDENTIFIER_TYPE,
        publisherId,
        subRangeId: canceledIdentifierSearchSubranges.map(sr => sr.id)
      },
      transaction: t
    });

    if (!canceledIdentifiers) {
      throw new ApiError(HttpStatus.CONFLICT, 'Error in fetching subrange information regarding canceled identifiers');
    }

    // In case batch is created without publication id, using count parameter as base for number of identifiers to generate
    // Otherwise, generating as many identifiers as required by the publication types of publication with selected publication id
    const countDefinition = count ?? publicationTypes.length;

    // Calculate how many new identifiers are needed
    const newIdentifiersRequiredCount = countDefinition - canceledIdentifiers.length < 0 ? 0 : countDefinition - canceledIdentifiers.length;

    // Calculate how many canceled identifiers should be utilized
    const canceledIdentifiersRequiredCount = countDefinition > canceledIdentifiers.length ? canceledIdentifiers.length : countDefinition;

    let identifierObjects = []; // eslint-disable-line
    const usedCanceledIdentifiers = [];

    // If new identifiers are required on top of using canceled identifiers
    if (newIdentifiersRequiredCount > 0) {
      // If active subrange free identifiers are not enough the amount left after utilizing all canceled
      if (activePublisherSubrange.free < newIdentifiersRequiredCount) {
        // Use of two valid publisher subranges for identifier generation is allowed only when:
        // - Publisher subranges consider category 1 (e.g., publisher subranges which contain 10 identifiers)
        // - Identifier generation considers generating identifiers for a publication (i.e., not identifier list)

        // Note: previous restraints were not included in the old implementation, they have been newly added
        if (activePublisherSubrange.category !== 1 || !publicationId) {
          throw new ApiError(HttpStatus.CONFLICT, 'Cannot produce enough identifiers from available active subrange.');
        }

        // Check if there is another subrange of same category than active that can be used for getting identifiers
        // Verify also that use of one alternative subrange would be enough to generate all required identifiers
        const alternativeSubranges = publisherSubRanges.filter(sr => sr.id !== activePublisherSubrange.id && !sr.isClosed && sr.category === activePublisherSubrange.category);
        if (alternativeSubranges.length === 0 || alternativeSubranges[0].free + alternativeSubranges[0].canceled < newIdentifiersRequiredCount - activePublisherSubrange.free) {
          throw new ApiError(HttpStatus.CONFLICT, 'Cannot produce enough identifiers from publisher\'s available subranges');
        }

        // Check if there are identifiers that should be cancelled from the active range before moving to utilize identifiers from alternative subrange
        if (activePublisherSubrange.free > 0) {
          // Generate all available identifiers from the currently active range
          const identifiersToGenerateFromActiveCount = activePublisherSubrange.free + activePublisherSubrange.canceled;
          const identifierBatchToCancel = await generateIdentifierBatch(publisherId, identifiersToGenerateFromActiveCount, 0, user, t);
          const identifiersToCancel = await identifierModel.findAll({where: {identifierBatchId: identifierBatchToCancel.id}, transaction: t});

          // Cancel identifiers that were generated from the currently active range so that they can be reused after new active range is set
          // Cancellation is done through the identifier interface so that all the related entities are taken care of
          for (let n = 0; n < identifiersToCancel.length; n++) { // eslint-disable-line no-plusplus
            await identifierInterface.cancel(identifiersToCancel[n].identifier, user, {transaction: t}); // eslint-disable-line no-await-in-loop
          }
        }

        // Activate the new range (deactivate all publisher identifier ranges that were active)
        await activate(alternativeSubranges[0].id, user, t);

        // Now that there are enough identifiers, utilize function recursively with new active subrange to generate identifiers for publication
        // Set useCanceledFromAnyRange true so that the identifiers that were cancelled from the previous active range are utilized
        return generateIdentifierBatch(publisherId, undefined, publicationId, user, t, true);
      }

      // Sanity check: number of generated identifiers may not exceed range end
      const expectedNext = Number(activePublisherSubrange.next) + newIdentifiersRequiredCount;
      if (expectedNext > Number(activePublisherSubrange.rangeEnd) + 1) {
        throw new ApiError(HttpStatus.CONFLICT, 'Subrange\'s internal counters produced an error. Please review subrange begin, end and free attributes.');
      }

      // Generate identifiers from active range
      const nextPointer = Number(activePublisherSubrange.next);

      // Generating new identifier objects
      for (let x = nextPointer; x < nextPointer + newIdentifiersRequiredCount; x++) { // eslint-disable-line no-plusplus
        const tmp = String(x).padStart(activePublisherSubrange.category, '0');

        // Guards provide sanity check regarding generated identifiers
        if (Number(tmp) > Number(activePublisherSubrange.rangeEnd)) {
          throw new ApiError(HttpStatus.CONFLICT, 'Generated identifier object would have exceeded the range end');
        }

        if (Number(tmp) < Number(activePublisherSubrange.rangeBegin)) {
          throw new ApiError(HttpStatus.CONFLICT, 'Generated identifier object would have been smaller the range begin');
        }

        const identifier = `${activePublisherSubrange.publisherIdentifier.replace(/-/ug, '')}${tmp}`;
        const checkDigit = calculateCheckDigitIsbn(identifier);
        const formattedIdentifier = `${activePublisherSubrange.publisherIdentifier}-${tmp}-${checkDigit}`;
        const publicationType = publicationTypes.length > 0 ? publicationTypes[publicationTypeIdx] : '';

        identifierObjects.push({
          identifier: formattedIdentifier,
          subRangeId: activePublisherSubrange.id,
          publicationType
        });

        // Add to results object, this mapping defines publication type <-> identifier link in db object
        results[formattedIdentifier] = publicationType;

        // Increase publication type index counter
        publicationTypeIdx++; // eslint-disable-line no-plusplus
      }

      // Update subrange
      const subrangeUpdateDoc = {
        next: String(Number(activePublisherSubrange.next) + newIdentifiersRequiredCount).padStart(activePublisherSubrange.category, '0'),
        free: activePublisherSubrange.free - newIdentifiersRequiredCount,
        taken: activePublisherSubrange.taken + newIdentifiersRequiredCount,
        modifiedBy: user.id
      };

      // If there are no free identifiers and no cancelled identifiers available, subrange needs
      // to be set non-active and closed
      if (subrangeUpdateDoc.free === 0 && activePublisherSubrange.canceled === 0) {
        subrangeUpdateDoc.isActive = false;
        subrangeUpdateDoc.isClosed = true;
      }

      // Sanity check: free and next attributes are sane after update
      if (subrangeUpdateDoc.free < 0 || Number(subrangeUpdateDoc.next) > Number(activePublisherSubrange.rangeEnd) + 1) {
        throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Cannot update subrange: results into invalid counter values');
      }

      await activePublisherSubrange.update(subrangeUpdateDoc, {transaction: t});
    }

    // Re-assign canceled identifiers. Note: could optimize decreaseCanceled to bulk operation.
    for (let i = 0; i < canceledIdentifiersRequiredCount; i++) { // eslint-disable-line no-plusplus
      const publicationType = publicationTypes.length > 0 ? publicationTypes[publicationTypeIdx] : '';

      identifierObjects.push({
        identifier: canceledIdentifiers[i].identifier,
        subRangeId: canceledIdentifiers[i].subRangeId,
        publicationType
      });

      // Add identifier <-> publication type linking to result
      results[canceledIdentifiers[i].identifier] = publicationType;

      // Update canceled identifiers array for future deletion from canceled table
      usedCanceledIdentifiers.push(canceledIdentifiers[i]);

      // Decrease canceled pointer from subrange
      const canceledIdentifierSubRange = await subRangeModelInterface.read(canceledIdentifiers[i].subRangeId, t); // eslint-disable-line no-await-in-loop

      if (canceledIdentifierSubRange.canceled - 1 < 0) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot decrease canceled if subrange has not got enough canceled identifiers');
      }

      const canceledSubRangeUpdateDoc = {
        canceled: canceledIdentifierSubRange.canceled - 1,
        isActive: !(canceledIdentifierSubRange.free === 0 && canceledIdentifierSubRange.canceled - 1 === 0),
        isClosed: Boolean(canceledIdentifierSubRange.free === 0 && canceledIdentifierSubRange.canceled - 1 === 0),
        modifiedBy: user.id
      };

      await canceledIdentifierSubRange.update(canceledSubRangeUpdateDoc, {transaction: t}); // eslint-disable-line no-await-in-loop

      // Increase publication type index counter
      publicationTypeIdx++; // eslint-disable-line no-plusplus
    }

    // Create identifier batch entity
    const batchDbDoc = {
      identifierType: IDENTIFIER_TYPE,
      identifierCount: newIdentifiersRequiredCount,
      identifierCanceledCount: 0,
      identifierDeletedCount: 0,
      publisherId,
      publicationId,
      identifierCanceledUsedCount: usedCanceledIdentifiers.length,
      subRangeId: activePublisherSubrange.id,
      createdBy: user.id
    };

    // Saving identifier batch to db
    const batchResult = await identifierBatchModelInterface.create(batchDbDoc, t);

    // Set batch id to all identifier objects
    const identifierDbDoc = identifierObjects.map(i => ({...i, identifierBatchId: batchResult.id}));

    // Validate identifiers
    if (identifierDbDoc.some(identifierObject => !isValidIdentifier(identifierObject.identifier, IDENTIFIER_TYPE))) {
      throw new ApiError(HttpStatus.CONFLICT, 'Encountered an error during identifier creation. Some identifier was malformed. Please contact system administrator.');
    }

    // Save identifiers to db through bulk operation, each identifier is to be validated
    await identifierModel.bulkCreate(identifierDbDoc, {validate: true, transaction: t});

    // Empty array so GC collects it
    identifierObjects.length = 0;

    // Remove used canceled identifiers
    if (usedCanceledIdentifiers.length > 0) {
      await Promise.all(usedCanceledIdentifiers.map(canceledIdentifier => canceledIdentifier.destroy({transaction: t})));
    }

    // Update publication information to db
    // Note: identifier <-> publicationType information is stored as JSONified string to db to publication entity.
    // Format is { "formattedIdentifier": "TYPE" }
    // Virtual getters and setters defined for sequelize models handle object->string->object conversions
    if (publicationId) {
      const printIdentifiers = _identifiersPrintToJSON(results);
      const electronicalIdentifiers = _identifiersElectronicalToJSON(results);

      const publicationUpdate = {
        publicationIdentifierType: IDENTIFIER_TYPE,
        onProcess: false,
        modifiedBy: user.id
      };

      if (publication.publicationFormat === 'PRINT') {
        publicationUpdate.publicationIdentifierPrint = printIdentifiers;
      } else if (publication.publicationFormat === 'ELECTRONICAL') {
        publicationUpdate.publicationIdentifierElectronical = electronicalIdentifiers;
      } else if (publication.publicationFormat === 'PRINT_ELECTRONICAL') {
        publicationUpdate.publicationIdentifierPrint = printIdentifiers;
        publicationUpdate.publicationIdentifierElectronical = electronicalIdentifiers;
      } else {
        throw new ApiError(HttpStatus.CONFLICT, 'Publication has invalid publication format value');
      }

      const publicationUpdateResult = await publication.update(publicationUpdate, {transaction: t});

      if (!publicationUpdateResult) {
        throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Updating publication information to database failed');
      }
    }

    return batchResult.toJSON();
  }

  /**
   * Transform identifier information from JSON to string format
   * @param {Object[]} identifiers Array of identifier objects
   * @returns Stringified JSON containing identifier information
   */
  function _identifiersPrintToJSON(identifiers) {
    const result = {};

    Object.keys(ISBN_REGISTRY_PUBLICATION_PRINT_TYPES).forEach(ptype => {
      const key = Object.keys(identifiers).find(key => identifiers[key] === ptype);

      if (key) {
        result[key] = identifiers[key];
      }
    });

    return Object.keys(result).length > 0 ? JSON.stringify(result) : '';
  }

  /**
   * Transform identifier information from JSON to string format
   * @param {Object[]} identifiers Array of identifier objects
   * @returns Stringified JSON containing identifier information
   */
  function _identifiersElectronicalToJSON(identifiers) {
    const result = {};

    Object.keys(ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES).forEach(ptype => {
      const key = Object.keys(identifiers).find(key => identifiers[key] === ptype);

      if (key) {
        result[key] = identifiers[key];
      }
    });

    return Object.keys(result).length > 0 ? JSON.stringify(result) : '';
  }
}
