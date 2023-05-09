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
import {Op} from 'sequelize';
import {createHash} from 'crypto';

import sequelize from '../../models';
import {ApiError} from '../../utils';
import {COMMON_IDENTIFIER_TYPES} from '../constants';
import abstractModelInterface from '../common/abstractModelInterface';
import {NODE_ENV} from '../../config';

/**
 * ISBN-registry identifier batch interface. Contains read, query, download and remove operations for ISBN-registry identifier batches.
 * @returns Interface to interact with ISBN-registry identifier batches
 */
export default function () {
  const identifierModel = sequelize.models.identifier;
  const identifierCanceledModel = sequelize.models.identifierCanceled;
  const identifierBatchModel = sequelize.models.identifierBatch;
  const identifierBatchDownloadModel = sequelize.models.identifierBatchDownload;
  const publicationModel = sequelize.models.publicationIsbn;
  const isbnSubrangeModel = sequelize.models.isbnSubRange;
  const ismnSubrangeModel = sequelize.models.ismnSubRange;
  const messageIsbnModel = sequelize.models.messageIsbn;

  const identifierBatchModelInterface = abstractModelInterface(identifierBatchModel);

  return {
    // Creation of identifier batches happens on isbn/ismn subrange interface depending on type of identifier batch created
    read,
    safeRemove,
    download,
    query
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
   * Read identifierBatch (ISBN/ISMN)
   * @param {number} id ID of identifier batch to read
   * @param {Object} user User requesting to read the batch
   * @returns Identifier batch as JSON on success, otherwise throws ApiError
   */
  async function read(id, user) {
    const result = await identifierBatchModel.findByPk(id, {
      include: [
        {
          association: 'identifiers',
          attributes: ['id', 'identifier', 'publicationType']
        },
        {
          association: 'publisher',
          attributes: ['officialName']
        }
      ]
    });

    if (result !== null) {
      const subrangeModel = getPublisherRangeModel(result.identifierType);
      const subrange = await subrangeModel.findByPk(result.subRangeId);

      if (subrange !== null) {
        return filterResult({...result.toJSON(), publisherIdentifier: subrange.publisherIdentifier}, user);
      }
    }

    throw new ApiError(HttpStatus.NOT_FOUND);

    /**
     * Transforms return value to have properties available for user type and filters results that should not
     * be available to some user types.
     * @param {Object} doc Identifier batch
     * @param {Object} user User making the request
     * @returns Identifier batch with appropriate attributes if valid, throws not found error if user has no access to entity
     */
    function filterResult(doc, user) {
      // System users and admins have access to all identifierBatch information
      const publisherName = doc.publisher.officialName;

      if (user && (user.role === 'admin' || user.role === 'system')) {
        const {publisher, ...filteredDoc} = doc;
        return {...filteredDoc, publisherName: publisher.officialName};
      }

      // If identifierBatch considers publication, it is not accessible by publishers/non-authenticated users
      if (doc.publicationId && doc.publicationId !== 0) {
        throw new ApiError(HttpStatus.NOT_FOUND);
      }

      // If batch considers a list, return basic information regarding it
      const {id, identifierType, identifierCount, publisherId, publisherIdentifier} = doc;

      return {id, identifierType, identifierCount, publisherName, publisherId, publisherIdentifier};
    }
  }

  /* eslint-disable max-statements,complexity */
  /**
   * Safely removes identifier batch by cancelling the identifiers. Identifiers may be reused. Batch may be removed if it:
   *   - Does not contain deleted or canceled identifier
   *   - No message regarding the batch has been sent
   *   - It was last batch generated from the publisher range it's associated with
   * @param {number} id ID of identifier batch to read
   * @param {Object} user User requesting to read the batch
   * @returns {boolean} True if deletion is successful, otherwise throws ApiError
   */
  async function safeRemove(id, user) {

    // Start transaction
    const t = await sequelize.transaction();
    try {
      // Find the identifier batch
      const identifierBatch = await identifierBatchModelInterface.read(id, t);

      // If any identifier has been canceled or deleted, cannot delete batch
      if (identifierBatch.identifierCanceledCount !== 0 || identifierBatch.identifierDeletedCount !== 0) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot delete identifier batch which has been canceled/deleted identifiers from');
      }

      // TO DO: add guard regarding whether batch can be deleted if it has been downloaded as text file

      // Get subrange model based on identifier type
      const subrangeModel = getPublisherRangeModel(identifierBatch.identifierType);

      // If batch was not latest given from subrange, cannot delete batch
      const latestBatchFromSubrange = await identifierBatchModel.findAll({
        where: {
          subRangeId: identifierBatch.subRangeId
        },
        order: [['id', 'DESC']],
        attributes: ['id'],
        limit: 1,
        transaction: t
      });

      if (!latestBatchFromSubrange || latestBatchFromSubrange.length !== 1 || latestBatchFromSubrange[0].id !== identifierBatch.id) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot delete batch since it was not latest batch given from subrange');
      }

      // If messages regarding the batch has been sent, cannot delete batch
      const associatedMessagesCount = await messageIsbnModel.count({where: {batchId: id}, transaction: t});
      if (associatedMessagesCount > 0) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot delete batch since a message regarding it was already sent to customer');
      }

      // Get identifiers. Note that for processing it's critical to have identifiers sorted based on identifier in descending order.
      const identifiers = await identifierModel.findAll({
        where: {identifierBatchId: identifierBatch.id},
        order: [['identifier', 'DESC']],
        transaction: t
      });

      // If subrange associated to batch cannot be found, cannot delete batch
      if (!identifierBatch.subRangeId || identifierBatch.subRangeId === 0) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot delete batch since a associated subrange information is missing');
      }

      // Decrease subranges counters based on information how many new identifiers was used for the batch
      const subrange = await subrangeModel.findByPk(identifierBatch.subRangeId, {transaction: t});
      if (subrange === null) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot delete batch since subrange associated with it could not be found');
      }

      // Check that the identifier corresponding previous next value of subrange is actually included into the batch.
      // This should resolve error that would occur after following scenario:
      // 1. Create batch #1
      // 2. Create batch #2
      // 3. Delete/cancel identifiers from batch #2 one by one
      //   -> Next pointer of subrange wont move through identifier cancellation/removal
      //   -> After cancelling/deleting final identifier of batch #2, the batch will be deleted and batch #1 will be latest and thus removal becomes valid
      // 4. Delete batch #1
      //   -> New items in this batch are falsely interpreted as last given from subrange, which results to wrong next value and identifiers not placed in the cancelled identifiers table
      // -> Overall result: identifiers that supposedly were permanently deleted may be given again
      const batchSubrangeIdentifiersNextNumbers = identifiers
        .filter(i => i.subRangeId === identifierBatch.subRangeId) // Filter only identifiers that were from the main subrange regarding batch as identifiers from other subranges are alwasy cancelled identifiers
        .map(i => i.identifier.split('-')[i.identifier.split('-').length - 2]); // for ISBN/ISMN identifiers, second to last entry when splitting with '-' is the number of entry in that subrange

      const previousNext = String(Number(subrange.next) - 1).padStart(subrange.category, '0');
      if (!batchSubrangeIdentifiersNextNumbers.includes(previousNext)) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot delete batch since it was not latest batch given from subrange.');
      }

      const subrangeUpdate = {
        next: String(Number(subrange.next) - identifierBatch.identifierCount).padStart(subrange.category, '0'),
        free: subrange.free + identifierBatch.identifierCount,
        taken: subrange.taken - identifierBatch.identifierCount,
        modifiedBy: user.id
      };

      if (subrange.isClosed) { // eslint-disable-line functional/no-conditional-statements
        subrangeUpdate.isClosed = false; // eslint-disable-line functional/immutable-data
      }

      // Update values to db
      await subrange.update(subrangeUpdate, {transaction: t});

      // If batch was linked to publication, remove identifiers information from publicationRequest
      if (identifierBatch.publicationId && identifierBatch.publicationId > 0) {
        const publication = await publicationModel.findByPk(identifierBatch.publicationId, {transaction: t});
        if (publication === null) {
          throw new ApiError(HttpStatus.CONFLICT, 'Cannot delete batch since publication associated with it could not be found from database');
        }

        const publicationUpdate = {
          publicationIdentifierPrint: '',
          publicationIdentifierElectronical: '',
          publicationIdentifierType: '',
          onProcess: true,
          modifiedBy: user.id
        };

        await publication.update(publicationUpdate, {transaction: t});
      }

      // Identifier count must match to batch information
      if (identifiers.length !== identifierBatch.identifierCount + identifierBatch.identifierCanceledUsedCount) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot delete batch since its identifier count does not match the count of identifiers found from database');
      }

      // Manage canceled identifier re-cancellation
      /* eslint-disable functional/no-conditional-statements, functional/immutable-data,functional/no-let */
      if (identifierBatch.identifierCanceledUsedCount > 0) {

        // Helper variables required for gathering the identifiers that can be canceled through update operation to subrange counters
        const identifierIdsCancellableThroughCounterUpdate = [];
        let identifierCounter = 0;

        // Helper array for gathering subrange id information
        const subrangeIds = [identifierBatch.subRangeId];

        // Loop through each of the identifiers that are sorted by identifier string to descending order
        identifiers.forEach(identifier => {
          // If the identifier belongs to the main subrange it's possible to logically interpret whether identifier was created as new:
          // - Since the identifiers are in descending order, the new identifiers are sorted to the begin of the array
          // - Since we know the amount of new identifiers generated from subrange (identifierCount), the counter keeps track where new identifiers end
          if (identifier.subRangeId === identifierBatch.subRangeId && identifierCounter < identifierBatch.identifierCount) {
            identifierIdsCancellableThroughCounterUpdate.push(identifier.id);
            identifierCounter += 1;
          }

          // Gather all subrange ids so that subranges can be retrieved from db
          if (!subrangeIds.includes(identifier.subRangeId)) {
            subrangeIds.push(identifier.subRangeId);
          }
        });

        // Gather all subranges from db
        const identifierSubrangeCache = await subrangeModel.findAll({where: {id: subrangeIds}, transaction: t});

        // TO DO: improve processing to remove unnecessary overhead from two separate forEach loops
        // For loop used because of async
        // eslint-disable-next-line
        for (let i = 0; i < identifiers.length; i++) {
          // Just to improve readability
          const identifier = identifiers[i];

          // Find identifers subrange from cache
          const identifierSubrange = identifierSubrangeCache.find(sr => sr.id === identifier.subRangeId);
          if (!identifierSubrange) {
            throw new ApiError(HttpStatus.CONFLICT, 'Cannot delete batch since one of its identifiers subrange could not be found from database');
          }

          // If publisher range does not equal the identifier batches publisher range, the identifier needs to be cancelled
          if (identifier.subRangeId !== identifierBatch.subRangeId || !identifierIdsCancellableThroughCounterUpdate.includes(identifier.id)) {
            const identifierCanceledEntry = {
              identifier: identifier.identifier,
              identifierType: identifierBatch.identifierType,
              category: identifierSubrange.category,
              publisherId: identifierBatch.publisherId,
              subRangeId: identifier.subRangeId,
              canceledBy: user.id
            };

            // Add cancelled entry to db
            await identifierCanceledModel.create(identifierCanceledEntry, {transaction: t}); // eslint-disable-line no-await-in-loop

            // Update range information
            const identifierSubrangeUpdate = {
              canceled: identifierSubrange.canceled + 1,
              modifiedBy: user.id
            };

            // If range was closed, re-open it
            // eslint-disable-next-line
            if (identifierSubrange.isClosed) {
              identifierSubrangeUpdate.isClosed = false;
            }

            // Update range to db
            await identifierSubrange.update(identifierSubrangeUpdate, {transaction: t}); // eslint-disable-line
          }
        }
      }
      /* eslint-enable functional/no-conditional-statements, functional/immutable-data,functional/no-let */

      // Delete identifiers
      await Promise.all(identifiers.map(i => i.destroy({transaction: t})));

      // Delete batch
      await identifierBatch.destroy({transaction: t});

      // Commit transaction and return success
      await t.commit();

      return true;
    } catch (err) {
      // Rollback transaction
      await t.rollback();

      throw err;
    }
  }
  /* eslint-enable max-statements,complexity */


  /**
   * Retrieves an identifier batch and retuns it as an formatted string suited for .txt file download.
   * @param {number} id ID of identifier batch to read
   * @param {Object} user User requesting to read the batch
   * @returns {string} Identifier batch identifiers as string concatenated with '\r\n' and including short descriptive header on success, otherwise throws ApiError
   */

  /* eslint-disable max-statements */
  async function download(id) {
    const result = await identifierBatchModel.findByPk(id, {
      attributes: ['id', 'publicationId'],
      include: [
        {
          association: 'identifiers',
          attributes: ['id', 'identifier', 'publicationType']
        },
        {
          association: 'publisher',
          attributes: ['officialName']
        }
      ]
    });

    if (result && result.identifiers) {
      // Disallow downloading identifier list assigned to a publication
      if (result.publicationId) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot download identifiers that have been assigned to a publication');
      }

      if (!result.publisher || !result.publisher.officialName) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot download identifiers that have problem with associated publisher information');
      }

      if (result.identifiers.length === 0) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot download identifiers as batch does not contain identifier information');
      }

      // Format to text file to include publisher information
      let headerText = `Seuraavat tunnukset on myönnetty kustantajalle ${result.publisher.officialName}\r\n`; // eslint-disable-line
      headerText += `Following identifiers have been assigned to publisher ${result.publisher.officialName}\r\n\r\n`;

      // Add test header for test environment
      if (NODE_ENV !== 'production') { // eslint-disable-line
        headerText += 'SEURAAVAT TUNNUKSET ON TUOTETTU TESTIJÄRJESTELMÄSTÄ JA NIITÄ EI MISSÄÄN NIMESSÄ PIDÄ OIKEASTI KÄYTTÄÄ!\r\n\r\n';
      }

      const resultBody = result.identifiers.reduce((acc, {identifier}) => `${acc}${identifier}\r\n`, headerText);
      const sha256sum = createHash('sha256')
        .update(resultBody)
        .digest('hex');

      // Save to downloads
      const identifierBatchDownload = {
        sha256sum,
        batchId: id
      };

      // Create entry to downloads table
      await identifierBatchDownloadModel.create(identifierBatchDownload);

      return resultBody;
    }

    throw new ApiError(HttpStatus.NOT_FOUND);
  }
  /* eslint-enable max-statements */

  /**
   * Queries ISBN-registry identifier batches based on given attributes.
   * @param {Object} guiOpts Options used for querying identifier batches from database
   * @returns {Object} Paged result set if query was successful, otherwise throws ApiError
   */
  async function query(guiOpts) {

    const attributes = ['id', 'subRangeId', 'identifierType', 'identifierCount', 'identifierCanceledCount', 'identifierDeletedCount', 'created'];
    const {publisherId, publicationId, includePublications, offset, limit} = guiOpts;
    const conditions = getConditions({publisherId, publicationId, includePublications});

    // If querying based on publicationId, include identifiers to response
    const include = publicationId ? {
      include: [
        {
          association: 'identifiers',
          attributes: ['id', 'identifier', 'publicationType']
        }
      ]
    } : {};

    const result = await identifierBatchModel.findAndCountAll({
      ...conditions,
      ...include,
      attributes,
      order: [['id', 'DESC']],
      limit,
      offset,
      subQuery: false, // Note: required for where clause with eagerly loaded associations to work together with limit/offset/order
      distinct: true, // Required for retrieving true count of distinct entries
      col: 'id' // Required for retrieving true count of distinct entries
    });

    // If using publisherId as query option, expand the result set with including ISBN/ISMN publisher identifier information
    if (publisherId) {
      const publisherIsbnBatches = result.rows.filter(batch => batch.identifierType === COMMON_IDENTIFIER_TYPES.ISBN);
      const publisherIsmnBatches = result.rows.filter(batch => batch.identifierType === COMMON_IDENTIFIER_TYPES.ISMN);

      const publisherIsbnRanges = await isbnSubrangeModel.findAll({where: {publisherId}});
      const publisherIsmnRanges = await ismnSubrangeModel.findAll({where: {publisherId}});

      const appendedResult = [
        ...publisherIsbnBatches.map(batch => appendPublisherRangeInformation(batch, publisherIsbnRanges)),
        ...publisherIsmnBatches.map(batch => appendPublisherRangeInformation(batch, publisherIsmnRanges))
      ];

      return {
        totalDoc: result.count,
        results: appendedResult
      };
    }

    const filteredResult = result.rows.map(filterResult);
    return {totalDoc: result.count, results: filteredResult};

    function filterResult(result) {
      const {subRangeId, ...rest} = result.toJSON(); // eslint-disable-line no-unused-vars
      return rest;
    }

    /**
     * Constructs sequelize query conditions based on given parameters.
     * @param {Object} guiOpts Options to construct sequelize query from
     * @returns {Object} Valid object to be used in sequelize query on success, otherwise throws an ApiError
     */
    function getConditions({publisherId, publicationId, includePublications}) {
      // Cannot query with both publisherId and publicationId
      if (publicationId && publisherId) {
        throw new ApiError('Accepting only either publisherId or publicationId as query parameter, not both.');
      }

      // If publisherId and publicationId are not set, query does not have conditions
      if (!publisherId && !publicationId) {
        return {};
      }

      // If publicationId is used, no additional conditions are required
      if (publicationId) {
        return {where: {publicationId}};
      }

      // If publisherId is used, include publications only if explicitly defined so. Otherwise include
      // only batches which do not reference to real publication. Since publicationId 0 may have been used as
      // placeholder, it's included to this alternative.
      return includePublications
        ? {where: {publisherId}}
        : {where: {[Op.and]: [{publisherId}, {[Op.or]: [{publicationId: null}, {publicationId: 0}]}]}};
    }

    /**
     * Appends publisher range information to identifier batch
     * @param {Object} identifierBatch Identifier batch entity to append information to
     * @param {Object[]} publisherRanges Set of publisher ranges to append information from
     */
    function appendPublisherRangeInformation(identifierBatch, publisherRanges) {
      const {subRangeId, ...rest} = identifierBatch.toJSON(); // eslint-disable-line no-unused-vars
      const publisherRange = publisherRanges.find(v => v.id === identifierBatch.subRangeId);

      return {
        ...rest,
        publisherRangeIdentifier: publisherRange ? publisherRange.publisherIdentifier : null
      };
    }
  }
}
