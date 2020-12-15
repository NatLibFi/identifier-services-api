/* eslint-disable max-lines */
/* eslint-disable max-statements */
/* eslint-disable max-depth */
/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file.
 *
 * API microservice of Melinda record batch import system
 *
 * Copyright (C) 2018-2019 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of melinda-record-import-api
 *
 * melinda-record-import-api program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * melinda-record-import-api is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 *
 */

import interfaceFactory from './interfaceModules';
import {hasPermission, validateDoc, formatPayloadCreateIsbnIsmn, calculatePublisherIdentifier, manageFormatDetails, calculatePublicationIdentifier, updateNext} from './utils';
import {ApiError} from '@natlibfi/identifier-services-commons';
import HttpStatus from 'http-status';
const moment = require('moment');

const rangesIsbnIsmnInterface = interfaceFactory('RangeIsbnIsmn');
const rangesSubIsbnIsmnInterface = interfaceFactory('SubRangeIsbnIsmn');
const rangesIsbnIsmnBatchInterface = interfaceFactory('RangeIsbnIsmnBatch');
const rangesIdentifierInterface = interfaceFactory('Identifier');
const publicationsInterface = interfaceFactory('Publication_ISBN_ISMN', 'PublicationIsbnIsmnContent');


export default function () {
  return {
    queryRanges,
    readRange,
    createIsbnIsmn,
    updateRange,
    querySubRanges,
    readSubRange,
    createSubRange,
    queryRangesIsbnIsmnBatch,
    readRangesIsbnIsmnBatch,
    createRangesIsbnIsmnBatch,
    readRangesIdentifier,
    queryRangesIdentifier
  };

  async function queryRanges(db, {queries, offset}, user) {
    try {
      if (hasPermission(user, 'ranges', 'queryRanges')) {
        const result = await rangesIsbnIsmnInterface.query(db, {queries, offset});
        return result;
      }

      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status);
      }
    }
  }

  async function readRange(db, id, user) {
    try {
      if (hasPermission(user, 'ranges', 'readRange')) {
        const result = await rangesIsbnIsmnInterface.read(db, id);
        if (result) {
          return result;
        }
        throw new ApiError(HttpStatus.NOT_FOUND);
      }
      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status);
      }
    }
  }


  async function createIsbnIsmn(db, doc, user) {
    if (Object.keys(doc).length === 0) { // eslint-disable-line functional/no-conditional-statement
      throw new ApiError(HttpStatus.BAD_REQUEST);
    }
    const newDoc = formatPayloadCreateIsbnIsmn(doc);
    try {
      if (validateDoc(newDoc, 'RangeIsbnIsmnContent')) {
        if (hasPermission(user, 'ranges', 'createIsbnIsmn')) {
          const queries = [
            {
              query: {}
            }
          ];
          await rangesIsbnIsmnInterface.query(db, {queries});
          // TO DO Check if ranges already exist
          const result = await rangesIsbnIsmnInterface.create(db, {
            ...newDoc,
            created: moment().format('yyyy-MM-DDTHH:mm:ss.SSZ')
              .toString(),
            createdBy: user.id
          }, user);
          return result;
        }
        throw new ApiError(HttpStatus.FORBIDDEN);
      }

      throw new ApiError(HttpStatus.BAD_REQUEST);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status ? err.status : HttpStatus.BAD_REQUEST);
      }
    }
  }

  function updateRange(db, id, doc, user) {

    try {
      if (Object.keys(doc).length === 0) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(HttpStatus.BAD_REQUEST);
      }
      if (validateDoc(doc, 'RangeIsbnIsmnContent')) {
        if (hasPermission(user, 'ranges', 'updateRange')) {
          return rangesIsbnIsmnInterface.update(db, id, doc, user);
        }

        throw new ApiError(HttpStatus.FORBIDDEN);
      }

      throw new ApiError(HttpStatus.BAD_REQUEST);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status ? err.status : HttpStatus.BAD_REQUEST);
      }
    }
  }

  async function querySubRanges(db, {queries, offset}, user) {
    try {
      if (hasPermission(user, 'ranges', 'querySubRanges')) {
        const result = await rangesSubIsbnIsmnInterface.query(db, {queries, offset});
        return result;
      }
      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status);
      }
    }
  }

  async function readSubRange(db, id, user) {
    try {
      if (hasPermission(user, 'ranges', 'readSubRange')) {
        const result = await rangesSubIsbnIsmnInterface.read(db, id);
        if (result) {
          return result;
        }
        throw new ApiError(HttpStatus.NOT_FOUND);
      }
      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status);
      }
    }
  }

  async function createSubRange(db, doc, user) {
    const {id, rangeId} = doc;
    try {
      if (hasPermission(user, 'ranges', 'createSubRange')) {
        const range = await rangesIsbnIsmnInterface.read(db, rangeId);
        if (range) {
          const {prefix, langGroup, rangeEnd, category, next, free, taken} = range;
          if (Number(rangeEnd) + 1 !== Number(next)) {
            const payload = {
              publisherIdentifier: '', // Value Changes after calculation
              publisherId: id,
              isbnIsmnRangeId: rangeId,
              category: '1',
              rangeStart: '', // Value Changes after calculation
              rangeEnd: '', // Value Changes after calculation
              free: '', // Value Changes after calculation
              taken: '0',
              canceled: '0',
              deleted: '0',
              next: ``, // Value Changes after calculation
              active: true,
              closed: false,
              idOld: '',
              created: moment().format(),
              createdBy: user.id
            };
            const newDoc = calculatePublisherIdentifier({payload, prefix, langGroup, next, category});
            if (validateDoc(newDoc, 'SubRangeIsbnIsmnContent')) {
              const result = await rangesSubIsbnIsmnInterface.create(db, newDoc);

              // Values to Update Big Block
              const rangeToUpdate = {...range, next: `${Number(next) + 1}`, free: `${Number(free) + 1}`, taken: `${Number(taken) + 1}`};
              const response = await updateRange(db, rangeId, rangeToUpdate, user); // Updates big Range block
              // eslint-disable-next-line max-depth
              if (response) {
                return result;
              }
              throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR);
            }
            throw new ApiError(HttpStatus.BAD_REQUEST);
          }
          throw new ApiError(HttpStatus.NOT_FOUND);
        }
        throw new ApiError(HttpStatus.FORBIDDEN);
      }

      throw new ApiError(HttpStatus.FORBIDDEN);

    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status);
      }
    }
  }


  async function queryRangesIsbnIsmnBatch(db, {queries, offset}, user) {
    try {
      if (hasPermission(user, 'ranges', 'queryRangesIsbnIsmnBatch')) {
        const result = await rangesIsbnIsmnBatchInterface.query(db, {queries, offset});
        return result;
      }
      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status);
      }
    }
  }

  async function readRangesIsbnIsmnBatch(db, id, user) {
    try {
      if (hasPermission(user, 'ranges', 'readRangesIsbnIsmnBatch')) {
        const result = await rangesIsbnIsmnBatchInterface.read(db, id);
        if (result) {
          return result;
        }
        throw new ApiError(HttpStatus.NOT_FOUND);
      }
      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status);
      }
    }
  }

  async function createRangesIsbnIsmnBatch(db, doc, user) {
    try {
      if (hasPermission(user, 'ranges', 'createRangesIsbnIsmnBatch')) {
        const {id, isbnIsmn, publisherId} = doc;
        const subRangeInfo = await rangesSubIsbnIsmnInterface.read(db, id);
        const formatDetailsArray = manageFormatDetails(isbnIsmn.formatDetails);
        // Condition if next + count is still inside rangeEnd needs to know the condition if not
        if (subRangeInfo.next + formatDetailsArray.length <= subRangeInfo.rangeEnd) {
          const batch = {
            identifierType: isbnIsmn.type === 'music' ? 'ISMN' : 'ISBN',
            identifierCount: formatDetailsArray.length,
            identifierCanceledCount: 0,
            identifierDeletedCount: 0,
            publisherId,
            publicationId: isbnIsmn._id,
            publisherIdentifierRangeId: id,
            created: moment().format(),
            createdBy: user.id
          };
          const batchId = await rangesIsbnIsmnBatchInterface.create(db, batch, user);
          const responseBatch = await rangesIsbnIsmnBatchInterface.read(db, batchId);

          // Calculate Publication identifier and create ranges for respective formatDetails in One batch
          formatDetailsArray.map(async (item, index) => {
            const payload = {
              identifier: calculatePublicationIdentifier(subRangeInfo.publisherIdentifier, index),
              identifierBatchId: batchId,
              publisherIdentifierRangeId: responseBatch.publisherIdentifierRangeId,
              publicationType: item
            };
            const result = await rangesIdentifierInterface.create(db, payload, user);
            if (result) {
              const subRangedoc = {
                ...subRangeInfo,
                free: `${Number(subRangeInfo.free) - formatDetailsArray.length}`,
                next: updateNext(subRangeInfo.next, formatDetailsArray.length)
              };
              return rangesSubIsbnIsmnInterface.update(db, id, subRangedoc, user);
            }
          });

          const queries = [
            {
              query: {publisherIdentifierRangeId: responseBatch.publisherIdentifierRangeId}
            }
          ];
          const currentIdentifier = await rangesIdentifierInterface.query(db, {queries, offset: null});
          if (currentIdentifier.results) {
            const {_id, ...publicationToUpdate} = { // eslint-disable-line no-unused-vars
              ...isbnIsmn,
              associatedRange: currentIdentifier.results.map(item => ({id: item.publisherIdentifierRangeId, subRange: subRangeInfo.publisherIdentifier})),
              identifier: currentIdentifier.results.map(item => ({id: item.identifier, type: item.publicationType}))
            };
            const finalResult = await publicationsInterface.update(db, isbnIsmn._id, publicationToUpdate, user);
            return finalResult;
          }
        }
      }

      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status);
      }
    }
  }


  async function readRangesIdentifier(db, id, user) {
    try {
      if (hasPermission(user, 'ranges', 'readRangesIdentifier')) {
        const result = await rangesIdentifierInterface.read(db, id);
        if (result) {
          return result;
        }
        throw new ApiError(HttpStatus.NOT_FOUND);
      }
      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status);
      }
    }
  }

  async function queryRangesIdentifier(db, {queries, offset}, user) {
    try {
      if (hasPermission(user, 'ranges', 'queryRangesIdentifier')) {
        const result = await rangesIdentifierInterface.query(db, {queries, offset});
        return result;
      }
      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status);
      }
    }
  }
}
