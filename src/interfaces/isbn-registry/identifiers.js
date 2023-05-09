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

import sequelize from '../../models';
import {ApiError} from '../../utils';
import {ISBN_REGISTRY_FORMATS, COMMON_IDENTIFIER_TYPES} from '../constants';

/**
 * ISBN-registry identifier interface. Contains cancel and remove operations for ISBN-registry identifiers.
 * @returns Interface to interact with ISBN-registry identifiers
 */
export default function () {
  const logger = createLogger();

  const identifierModel = sequelize.models.identifier;
  const identifierCanceledModel = sequelize.models.identifierCanceled;
  const identifierBatchModel = sequelize.models.identifierBatch;
  const publicationIsbnModel = sequelize.models.publicationIsbn;
  const messageIsbnModel = sequelize.models.messageIsbn;

  return {
    cancel,
    remove
  };

  /**
 * Get sequelize model for publisher range based on identifier type.
 * @param {string} identifierType Type of identifer to fetch model for
 * @returns Sequelize model
 */
  function getPublisherRangeModel(identifierType) {
    if (identifierType === COMMON_IDENTIFIER_TYPES.ISBN) {
      return sequelize.models.isbnSubRange;
    }

    if (identifierType === COMMON_IDENTIFIER_TYPES.ISMN) {
      return sequelize.models.ismnSubRange;
    }

    throw new Error('Unsupported identifier type!');
  }

  /**
   * Cancel identifier given as parameter
   * @param {string} identifier Identifier string, e.g. '978-951-0-00000-0'
   * @param {Object} user User requesting to read the batch
   * @param {Object} queryOpts Sequelize query options
   * @returns {boolean} True on success, otherwise throws ApiError
   */
  async function cancel(identifier, user, queryOpts = {}) { // eslint-disable-line require-await
    logger.info(`Start ISBN-registry cancellation process of identifier ${identifier}`);
    return cancelIdentifier(identifier, user, false, queryOpts);
  }

  /**
   * 'Permanently' remove identifier given as parameter. 'Permanent removal' in this context
   * means that the subranges counter will not be returned to position where it should ever
   * again reach the next value of the identifier and that the identifier will not be placed
   * to cancelled identifier table to be re-used.
   * @param {string} identifier Identifier string, e.g. '978-951-0-00000-0'
   * @param {Object} user User requesting to read the batch
   * @param {Object} queryOpts Sequelize query options
   * @returns {boolean} True on success, otherwise throws ApiError
   */
  async function remove(identifier, user, queryOpts = {}) { // eslint-disable-line require-await
    logger.info(`Start ISBN-registry permanent removal process of identifier ${identifier}`);
    return cancelIdentifier(identifier, user, true, queryOpts);
  }

  /**
   * Cancels or 'permanently' deletes identifier depending on the 'permanent' parameter value. Canceled identifiers are reused automatically through
   * usage of canceled items table in the identifier batch generation.
   * @param {string} identifier Identifier to be canceled or 'permanently' removed
   * @param {Object} user User attempting the operation
   * @param {boolean} permanent Whether to cancel identifier (reuse allowed) or permanently delete identifier (reuse not allowed)
   * @param {Object} queryOpts Sequelize query options (mainly transaction)
   * @returns {boolean} True if cancellation operation was successful, otherwise throws ApiError
   */
  /* eslint-disable max-params,max-statements,complexity,functional/no-conditional-statements,functional/immutable-data */
  async function cancelIdentifier(identifier, user, permanent = false, queryOpts = {}) {

    // Define transaction, prioritize use of existing one if it's given in queryOpts
    const t = queryOpts.transaction || await sequelize.transaction();
    try {
      // Find identifier object based on the identifier string
      const identifierObjects = await identifierModel.findAll({where: {identifier}, transaction: t});

      // Identifier that was not found cannot be deleted
      if (!identifierObjects || identifierObjects.length === 0) {
        throw new ApiError(HttpStatus.NOT_FOUND);
      }

      // If there were multiple identifiers found (should not be possible due to UNIQUE constraint in db table)
      // Raise an error which should alert system administrator
      if (identifierObjects.length > 1) {
        throw new ApiError(HttpStatus.CONFLICT, 'Found multiple identifiers with same identifier attribute. Alert system administrator and tell them this message: E100');
      }

      // Retrieve identifier, identifier batch, subrange and publication information associated with identifier
      const identifierObject = identifierObjects[0]; // eslint-disable-line
      const identifierBatch = await identifierBatchModel.findByPk(identifierObject.identifierBatchId, {transaction: t});

      // Cannot delete identifier without having identifier batch to operate on
      if (identifierBatch === null) {
        throw new ApiError(HttpStatus.CONFLICT, 'Could not find identifier batch associated with identifier');
      }

      // If publication is defined in identifiers identifier batch, it's required to be found from database also
      const publication = identifierBatch.publicationId ? await publicationIsbnModel.findByPk(identifierBatch.publicationId, {transaction: t}) : undefined;
      if (identifierBatch.publicationId && publication === null) {
        throw new ApiError(HttpStatus.CONFLICT, 'Could not find publication linked to identifier');
      }

      // Note: it's CRITICAL that the subrange to process is associated to identifier and not identifier batch!
      // This is because there are cases where two subranges have been used for generating identifiers in one batch
      // Through cancelling the identifiers of first subrange and introducing these cancelled identifiers along with any identifiers
      // generated from the another subrange.
      const subRangeModel = getPublisherRangeModel(identifierBatch.identifierType);
      const subrange = await subRangeModel.findByPk(identifierObject.subRangeId, {transaction: t});
      // Cannot delete identifier without having associated subrange to operate on
      if (subrange === null) {
        throw new ApiError(HttpStatus.CONFLICT, 'Could not find subrange associated with identifier batch which is associated with identifier');
      }

      // Do not allow cancellation of identifiers/batches that are associated with messages
      // Permanent deletion is allowed but in that case batch reference is to be set null if the last identifier of batch and the batch itself are permanenlty deleted
      const relatedMessagesCount = await messageIsbnModel.count({where: {batchId: identifierBatch.id}, transaction: t});
      if (!permanent && relatedMessagesCount > 0) {
        throw new ApiError(HttpStatus.CONFLICT, 'Messages regarding identifier have already been sent. Cannot delete identifier.');
      }

      // Identifier batch may consist of newly generated identifiers (identifierCount) + canceled identifiers that have been reused (identifierCanceledUsedCount)
      const totalCount = identifierBatch.identifierCount + identifierBatch.identifierCanceledUsedCount;

      // If it's the only identifier of the batch that is not either canceled or deleted, we need to delete batch instead of updating it
      if (totalCount === 1 || identifierBatch.identifierCanceledCount + identifierBatch.identifierDeletedCount === totalCount - 1) {
        logger.info('Identifier was last of identifiers associated with identifier batch. Identifier batch will be removed.');

        // Delete batch
        await identifierBatch.destroy({transaction: t});

        // If the batch was associated with message, set messages batchId reference to null as the batch does not exist anymore
        if (relatedMessagesCount > 0) {
          await messageIsbnModel.update({batchId: null}, {where: {batchId: identifierBatch.id}, transaction: t});
        }

        // If identifier is associated with publication, empty the publication entities identifier definitions
        if (publication) {
          logger.info(`Identifier was last of identifiers associated with a publication id ${publication.id}.`);
          logger.info(`Publication id ${publication.id} will have its identifier information removed and status set to onProcess`);

          const publicationUpdateInformation = {
            publicationIdentifierPrint: '',
            publicationIdentifierElectronical: '',
            publicationIdentifierType: '',
            onProcess: true,
            modifiedBy: user.id
          };

          await publication.update(publicationUpdateInformation, {transaction: t});
        }
      } else {
        logger.info(`Identifier was not last of identifiers associated with identifier batch. Identifier batch id ${identifierBatch.id} will remain in the database.`);

        // If identifier was not last of the batch, update batch information depending if the deletion is permanent or not
        // At this time, batch does not have modifiedBy attribute in the table definitions and thus user information regarding update cannot be preserved
        if (permanent) {
          // Update batch deleted count
          logger.info(`Incrementing deleted count of batch id ${identifierBatch.id}`);

          const identifierBatchUpdate = {identifierDeletedCount: identifierBatch.identifierDeletedCount + 1};
          await identifierBatch.update(identifierBatchUpdate, {transaction: t});
        } else {
          // Update batch canceled count
          logger.info(`Incrementing canceled count of batch id ${identifierBatch.id}`);

          const identifierBatchUpdate = {identifierCanceledCount: identifierBatch.identifierCanceledCount + 1};
          await identifierBatch.update(identifierBatchUpdate, {transaction: t});
        }

        // Remove identifier from publication information
        // Note: type/filetype information is left intact so there is some information left of the type of identifier that has been canceled.
        // This information is to be utilized in the statistics in future so do not change this unless same information is preserved in some other manner.
        if (identifierBatch.publicationId) {
          logger.info(`Removing identifier ${identifier} from publication id ${publication.id} identifier information`);

          const publicationJson = publication.toJSON();
          const publicationUpdateInformation = {
            modifiedBy: user.id
          };

          // Update publication identifier information based on publication format
          if (publication.publicationFormat === ISBN_REGISTRY_FORMATS.PRINT) {
            publicationUpdateInformation.publicationIdentifierPrint = removeIdentifierFromPublicationIdentifierSet(publicationJson.publicationIdentifierPrint, identifier);
          } else if (publication.publicationFormat === ISBN_REGISTRY_FORMATS.ELECTRONICAL) {
            publicationUpdateInformation.publicationIdentifierElectronical = removeIdentifierFromPublicationIdentifierSet(publicationJson.publicationIdentifierElectronical, identifier);
          } else if (publication.publicationFormat === ISBN_REGISTRY_FORMATS.PRINT_ELECTRONICAL) {
            publicationUpdateInformation.publicationIdentifierPrint = removeIdentifierFromPublicationIdentifierSet(publicationJson.publicationIdentifierPrint, identifier);
            publicationUpdateInformation.publicationIdentifierElectronical = removeIdentifierFromPublicationIdentifierSet(publicationJson.publicationIdentifierElectronical, identifier);
          } else {
            throw new ApiError(HttpStatus.CONFLICT, 'Identifier is associated with publication which format is not acceptable');
          }

          await publication.update(publicationUpdateInformation, {transaction: t});
        }
      }

      // Delete identifier from db
      await identifierObject.destroy({transaction: t});

      // Process subrange information update depending whether deletion was permanent or not
      if (permanent) {
        // If deletion is permanent, increment deleted attribute of subrange
        const subrangeUpdate = {
          deleted: subrange.deleted + 1,
          modifiedBy: user.id
        };

        // Update subrange to database
        logger.info(`Incrementing deleted count of subrange id ${subrange.id}`);
        await subrange.update(subrangeUpdate, {transaction: t});
      } else {
        // Create canceled identifier object
        const canceledIdentifier = {
          identifier,
          identifierType: identifierBatch.identifierType,
          category: subrange.category,
          publisherId: subrange.publisherId,
          subRangeId: subrange.id,
          canceledBy: user.id
        };

        // Create new canceled identifier entry to db
        await identifierCanceledModel.create(canceledIdentifier, {transaction: t});
        logger.info(`Created new canceled identifier entry`);

        // Update subrange attributes
        const subrangeUpdate = {
          canceled: subrange.canceled + 1,
          modifiedBy: user.id
        };

        // If subrange was closed, activate it since there is now one canceled identifier that may be reused
        if (subrange.isClosed) {
          subrangeUpdate.isClosed = false;
        }

        // Save update to db
        logger.info(`Incrementing canceled count of subrange id ${subrange.id}`);
        await subrange.update(subrangeUpdate, {transaction: t});
      }

      // If transaction was declared in this scope, it needs to be committed
      if (!Object.prototype.hasOwnProperty.call(queryOpts, 'transaction')) {
        await t.commit();
      }

      // Finally return true as operations were completed successfully
      return true;
    } catch (err) {
      // If transaction was declared in this scope, it needs to be rollbacked in this scope also
      if (!Object.prototype.hasOwnProperty.call(queryOpts, 'transaction')) {
        await t.rollback();
      }

      // Throw error upwards
      throw err;
    }

    /**
     * Filters identifier from the publication identifier set (publicationIdentifierPrint/publicationIdentifierElectronical)
     * @param {string} identifiers Stringified representation of publications identifiers. E.g., '{"978-951-0-00000-0": "PDF"}'
     * @param {string} identifierToRemove Identifier to remove from identifiers information
     * @returns {(string|null)} Stringified JSON representation of identifiers if there were identifiers. Otherwise null or empty string.
     */
    function removeIdentifierFromPublicationIdentifierSet(identifiers, identifierToRemove) {
      // If identifier string is empty or value is null, the value should not change
      if (identifiers === '' || identifiers === null) {
        return identifiers;
      }

      // If the value is undefined or other type than string, raise an error
      if (!identifiers || typeof identifiers !== 'string') {
        throw new Error('Cannot remove identifiers from publication due to following reason: identifier set was given as input in invalid format');
      }

      // Parse JSON and remove defined identifier from the object
      const identifiersJson = JSON.parse(identifiers);
      const result = Object.keys(identifiersJson).reduce((acc, key) => {
        if (key === identifierToRemove) {
          return {...acc};
        }
        return {...acc, [key]: identifiersJson[key]};
      }, {});

      // Return stringified object if there are any keys, otherwise return empty string as its the default value
      return Object.keys(result).length === 0 ? '' : JSON.stringify(result);
    }
  }
  /* eslint-enable max-params,max-statements,complexity */
}
