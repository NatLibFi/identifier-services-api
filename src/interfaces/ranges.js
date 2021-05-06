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
import {ApiError} from '@natlibfi/identifier-services-commons';
import HttpStatus from 'http-status';
import {
  hasPermission,
  validateDoc,
  validateRange,
  formatPayloadCreateIsbn,
  formatPayloadCreateIsmn,
  calculatePublisherIdentifier,
  manageFormatDetails,
  calculatePublicationIdentifier,
  updateNext
} from './utils';

const {ObjectId} = require('mongodb');
const rangesIsbnInterface = interfaceFactory('RangeIsbn');
const rangesSubIsbnInterface = interfaceFactory('SubRangeIsbn');
const rangesBatchInterface = interfaceFactory('RangeBatch');
const rangesIdentifierInterface = interfaceFactory('Identifier');
const subRangeIsbnCanceledInterface = interfaceFactory('SubRangeIsbnCanceled');
const rangesIsmnInterface = interfaceFactory('RangeIsmn');
const rangesSubIsmnInterface = interfaceFactory('SubRangeIsmn');
const subRangeIsmnCanceledInterface = interfaceFactory('SubRangeIsmnCanceled');

const publicationsInterface = interfaceFactory('Publication_ISBN_ISMN');
const publicationsIssnInterface = interfaceFactory('Publication_ISSN');
const rangesISSNInterface = interfaceFactory('RangeIssn');
const publisherInterface = interfaceFactory('PublisherMetadata');


export default function () {
  return {
    queryIsbnRanges,
    readIsbnRange,
    createIsbn,
    updateIsbnRange,
    queryIsbnSubRanges,
    readIsbnSubRange,
    createIsbnSubRange,
    revokeIsbnSubRange,
    queryRangesBatch,
    readRangesIsbnBatch,
    createRangesIsbnBatch,
    pickRangeList,
    readRangesIdentifier,
    queryRangesIdentifier,
    createIsmn,
    updateIsmnRange,
    createIsmnSubRange,
    revokeIsmnSubRange,
    readIsmnSubRange,
    queryIsmnSubRanges,
    createRangesIsmnBatch,
    queryIsmnRanges,
    createIssn,
    readIssn,
    updateIssn,
    queryIssn,
    queryIssnStatistics,
    queryIsbnIsmnStatistics,
    queryIsbnIsmnMonthlyStatistics,
    assignIssnRange,
    revokeIdentifier
  };

  async function queryIsbnRanges(db, {queries}, user) {
    try {
      if (hasPermission(user, 'ranges', 'queryRanges')) {
        const result = await rangesIsbnInterface.query(db, {queries});
        return result;
      }

      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status);
      }
    }
  }

  async function readIsbnRange(db, id, user) {
    try {
      if (hasPermission(user, 'ranges', 'readRange')) {
        const result = await rangesIsbnInterface.read(db, id);
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


  async function createIsbn(db, doc, user) {
    if (Object.keys(doc).length === 0) { // eslint-disable-line functional/no-conditional-statement
      throw new ApiError(HttpStatus.BAD_REQUEST);
    }
    const newDoc = formatPayloadCreateIsbn(doc);
    try {
      if (validateDoc(newDoc, 'RangeIsbnContent')) {
        if (hasPermission(user, 'ranges', 'createIsbn')) {
          const queries = [
            {
              query: {}
            }
          ];
          await rangesIsbnInterface.query(db, {queries});
          // TO DO Check if ranges already exist
          const result = await rangesIsbnInterface.create(db, {
            ...newDoc,
            created: {user: user.id}
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

  function updateIsbnRange(db, id, doc, user) {
    try {
      if (Object.keys(doc).length === 0) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(HttpStatus.BAD_REQUEST);
      }
      if (validateDoc(doc, 'RangeIsbnContent')) {
        if (hasPermission(user, 'ranges', 'updateRange')) {
          return rangesIsbnInterface.update(db, id, doc, user);
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

  async function queryIsbnSubRanges(db, {queries}, user) {
    try {
      if (hasPermission(user, 'ranges', 'querySubRanges')) {
        const result = await rangesSubIsbnInterface.query(db, {queries});
        return result;
      }
      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status);
      }
    }
  }

  async function readIsbnSubRange(db, id, user) {
    try {
      if (hasPermission(user, 'ranges', 'readSubRange')) {
        const result = await rangesSubIsbnInterface.read(db, id);
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

  async function createIsbnSubRange(db, doc, user) {
    const {id, rangeId} = doc;
    try {
      if (hasPermission(user, 'ranges', 'createSubRange')) {
        const response = await rangesIsbnInterface.read(db, rangeId);
        const {_id, ...range} = response; // eslint-disable-line no-unused-vars
        if (range) {
          const {prefix, langGroup, rangeStart, rangeEnd, category, next, free, taken, active} = range;
          if (Number(rangeEnd) + 1 !== Number(next)) {
            const payload = {
              publisherIdentifier: '', // Value Changes after calculation
              publisherId: id,
              isbnRangeId: rangeId,
              category,
              rangeStart: '', // Value Changes after calculation
              rangeEnd: '', // Value Changes after calculation
              free: '', // Value Changes after calculation
              taken: '0',
              canceled: '0',
              deleted: '0',
              next: ``, // Value Changes after calculation
              active: true,
              isClosed: false,
              created: {user: user.id}
            };
            const newDoc = calculatePublisherIdentifier({payload, prefix, langGroup, next, category});
            if (validateDoc(newDoc, 'SubRangeIsbnContent')) {
              if (active && Number(free) > 0) {
                const result = await rangesSubIsbnInterface.create(db, newDoc);
                // Values to Update Big Block
                const rangeToUpdate = {
                  ...range,
                  next: Number(updateNext(next, 1)) <= Number(rangeEnd) ? updateNext(next, 1) : 'N/A',
                  free: Number(free) - 1 <= 0 ? '0' : `${Number(free) - 1}`,
                  taken: Number(taken) + 1 <= Number(rangeEnd) - Number(rangeStart) ? `${Number(taken) + 1}` : (Number(rangeEnd) - Number(rangeStart)).toString(),
                  active: !Number(updateNext(next, 1) > Number(rangeEnd))
                };
                const response = await updateIsbnRange(db, rangeId, rangeToUpdate, user); // Updates big Range block
                if (response) {
                  return result;
                }
                throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR);
              }
              throw new ApiError(HttpStatus.NOT_ACCEPTABLE);
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

  async function revokeIsbnSubRange(db, {queries}, user) {
    try {
      if (hasPermission(user, 'ranges', 'revokeIsbnSubRange')) {
        const subRangeTobeRevoked = await rangesSubIsbnInterface.queryAllRecords(db, {query: queries[0].query});
        if (subRangeTobeRevoked) {
          const {publisherIdentifier, category, id, publisherId, isbnRangeId} = subRangeTobeRevoked[0]; // eslint-disable-line prefer-destructuring
          const responesIsbnRange = await rangesIsbnInterface.read(db, isbnRangeId);
          const newDoc = {
            identifier: publisherIdentifier,
            category,
            rangeId: id,
            publisherId,
            created: {user: user.id}
          };
          const {_id, ...isbnRange} = responesIsbnRange;
          if (validateDoc(newDoc, 'SubRangeIsbnCancel')) {
            const responseDeleteSubRange = await rangesSubIsbnInterface.remove(db, id);
            const newIsbnRange = {
              ...isbnRange,
              free: (Number(isbnRange.free) + 1).toString(),
              // eslint-disable-next-line no-nested-ternary
              next: isbnRange.next === 'N/A'
                ? isbnRange.rangeEnd
                : Number(isbnRange.next) - 1 <= Number(isbnRange.rangeEnd)
                  ? (Number(isbnRange.next) - 1).toString()
                  : 'N/A',
              canceled: (Number(isbnRange.canceled) + 1).toString(),
              active: true,
              taken: Number(isbnRange.taken) - 1 < Number(isbnRange.rangeEnd) - Number(isbnRange.rangeStart) ? (Number(isbnRange.taken) - 1).toString() : '0'
            };

            if (responseDeleteSubRange) {
              const responseIsbnRangeUpdate = await rangesIsbnInterface.update(db, _id, newIsbnRange, user);
              if (responseIsbnRangeUpdate) {
                const responseRevokedRecord = await subRangeIsbnCanceledInterface.create(db, newDoc);
                if (responseRevokedRecord) {
                  const responseReadPublisher = await publisherInterface.read(db, publisherId);
                  const newPublisher = {
                    ...responseReadPublisher,
                    publisherRangeId: responseReadPublisher.publisherRangeId.filter(item => item !== id),
                    publisherIdentifier: responseReadPublisher.publisherIdentifier.filter(item => item !== publisherIdentifier)
                  };
                  const responsePublisherUpdate = await publisherInterface.update(db, publisherId, newPublisher, user);
                  if (responsePublisherUpdate) {
                    return responsePublisherUpdate;
                  }
                }
              }

            }
          }
          throw new ApiError(HttpStatus.BAD_REQUEST);
        }
      }
    } catch (err) {
      throw new ApiError(err.status);
    }
    throw new ApiError(HttpStatus.FORBIDDEN);
  }


  async function queryRangesBatch(db, {queries}, user) {
    try {
      if (hasPermission(user, 'ranges', 'queryRangesIsbnBatch')) {
        const result = await rangesBatchInterface.query(db, {queries});
        return result;
      }
      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status);
      }
    }
  }

  async function readRangesIsbnBatch(db, id, user) {
    try {
      if (hasPermission(user, 'ranges', 'readRangesIsbnBatch')) {
        const result = await rangesBatchInterface.read(db, id);
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

  async function createRangesIsbnBatch(db, doc, user) {
    try {
      if (hasPermission(user, 'ranges', 'createRangesIsbnBatch')) {
        const {id, isbnIsmn, publisherId} = doc;
        if (isbnIsmn.type !== 'music') {
          const subRangeInfo = await rangesSubIsbnInterface.read(db, id);
          const initialFormatDetailsArray = manageFormatDetails(isbnIsmn.formatDetails);
          const response = isbnIsmn.identifier && isbnIsmn.identifier.length > 0
            ? initialFormatDetailsArray.filter(item => !isbnIsmn.identifier.map(i => i.type).includes(item))
            : initialFormatDetailsArray;
          const batchLength = Number(subRangeInfo.next) + response.length > Number(subRangeInfo.rangeEnd)
            ? Number(subRangeInfo.free) : response.length;
          const formatDetailsArray = response.slice(0, batchLength);
          // Condition if next + count is still inside rangeEnd needs to know the condition if not
          const batch = {
            identifierType: 'ISBN',
            identifierCount: formatDetailsArray.length,
            identifierCanceledCount: 0,
            identifierDeletedCount: 0,
            publisherId,
            publicationId: isbnIsmn._id,
            publisherIdentifierRangeId: id,
            created: {user: user.id}
          };
          const batchId = await rangesBatchInterface.create(db, batch, user);
          const responseBatch = await rangesBatchInterface.read(db, batchId);
          // Calculate Publication identifier and create ranges for respective formatDetails in One batch
          formatDetailsArray.map(async (item, index) => {
            if (subRangeInfo.active) {
              const calculateNextValue = `${subRangeInfo.publisherIdentifier}-${subRangeInfo.next}`;
              const payload = {
                identifier: calculatePublicationIdentifier(calculateNextValue, subRangeInfo.category, index, 'isbn'),
                identifierBatchId: batchId,
                publisherIdentifierRangeId: responseBatch.publisherIdentifierRangeId,
                publicationType: item
              };
              const result = await rangesIdentifierInterface.create(db, payload, user);
              if (result) {
                const subRangedoc = {
                  ...subRangeInfo,
                  taken: `${Number(subRangeInfo.taken) + formatDetailsArray.length}`,
                  free: `${Number(subRangeInfo.free) - formatDetailsArray.length}`,
                  next: updateNext(subRangeInfo.next, formatDetailsArray.length),
                  active: !(Number(subRangeInfo.next) + index + 1 > Number(subRangeInfo.rangeEnd))
                };
                return rangesSubIsbnInterface.update(db, id, subRangedoc, user);
              }
            }
            throw new ApiError('Selected Range is inactive!!!');
          });

          const queries = [
            {
              query: {identifierBatchId: batchId}
            }
          ];
          const currentIdentifier = await rangesIdentifierInterface.query(db, {queries});
          if (currentIdentifier.results) {
            const {_id, ...publicationToUpdate} = { // eslint-disable-line no-unused-vars
              ...isbnIsmn,
              associatedRange: filterDuplicateValueInArray(currentIdentifier.results.map(item => ({id: item.publisherIdentifierRangeId, subRange: subRangeInfo.publisherIdentifier}))),
              identifier: currentIdentifier.results.map(item => ({id: item.identifier, type: item.publicationType}))
            };
            const finalResult = await publicationsInterface.update(db, isbnIsmn._id, publicationToUpdate, user);
            return finalResult;
          }
        }

        throw new ApiError(HttpStatus.BAD_REQUEST);
      }

      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status);
      }
    }
  }

  async function pickRangeList(db, doc, user) {
    try {
      const {publisherId, identifierType, identifierCount, subRangeId} = doc;
      const subRangeInfo = await rangesSubIsbnInterface.read(db, subRangeId);

      const batch = {
        identifierType,
        identifierCount,
        identifierCanceledCount: 0,
        identifierDeletedCount: 0,
        publisherId: publisherId.value,
        publicationId: '',
        publisherIdentifierRangeId: subRangeId,
        created: {user: user.id}
      };
      const batchId = await rangesBatchInterface.create(db, batch, user);
      const responseBatch = await rangesBatchInterface.read(db, batchId);
      const newArray = new Array(Number(identifierCount)).fill('');
      await newArray.map(async (item, index) => {
        if (subRangeInfo.active) {
          const calculateNextValue = `${subRangeInfo.publisherIdentifier}-${subRangeInfo.next}`;
          const payload = {
            identifier: calculatePublicationIdentifier(calculateNextValue, subRangeInfo.category, index, 'isbn'),
            identifierBatchId: batchId,
            publisherIdentifierRangeId: responseBatch.publisherIdentifierRangeId,
            publicationType: 'ISBN',
            created: {user: user.id}
          };
          const result = await rangesIdentifierInterface.create(db, payload, user);
          if (result) {
            const subRangedoc = {
              ...subRangeInfo,
              taken: `${Number(subRangeInfo.taken) + Number(identifierCount)}`,
              free: `${Number(subRangeInfo.free) - Number(identifierCount)}`,
              next: updateNext(subRangeInfo.next, Number(identifierCount)),
              active: !(Number(subRangeInfo.next) + index + 1 > Number(subRangeInfo.rangeEnd))
            };

            await rangesSubIsbnInterface.update(db, subRangeId, subRangedoc, user);
            return result;
          }
        }
        throw new ApiError('Selected Range is inactive!!!');
      });
    } catch (err) {
      throw new ApiError(err.status);
    }
  }

  async function queryIsbnIsmnMonthlyStatistics(db, query, user) {
    try {
      // Const publisherResponse = await publisherInterface.queryAllRecords(db, query);
      // TO DO
      // Query for different records for monthly statistics and return the values
      // Not Completed yet
      if (hasPermission(user, 'ranges', 'queryRanges')) {
        const result = await rangesIsbnInterface.queryAllRecords(db, query);
        return result;
      }

      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status);
      }
    }
  }

  async function queryIsbnIsmnStatistics(db, {query}, user) {
    try {
      if (hasPermission(user, 'ranges', 'queryRanges')) {
        if (query === 'ISBN') {
          const rangeResponse = await rangesIsbnInterface.queryAll(db);
          return rangeResponse.map((item) => {
            const {prefix, langGroup, rangeStart, rangeEnd, free, taken} = item;
            return {prefix, langGroup, rangeStart, rangeEnd, free, taken};
          });
        }

        if (query === 'ISMN') {
          const rangeResponse = await rangesIsmnInterface.queryAll(db);
          return rangeResponse.map((item) => {
            const {prefix, rangeStart, rangeEnd, free, taken} = item;
            return {prefix, rangeStart, rangeEnd, free, taken};
          });
        }
      }

      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status);
      }
    }
  }

  function filterDuplicateValueInArray(arr) {
    return arr.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
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

  async function queryRangesIdentifier(db, {queries}, user) {
    try {
      if (hasPermission(user, 'ranges', 'queryRangesIdentifier')) {
        const result = await rangesIdentifierInterface.query(db, {queries});
        return result;
      }
      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status);
      }
    }
  }
  async function createIssn(db, doc, user) {
    try {
      if (validateDoc(doc, 'RangeBaseISSN')) {
        if (hasPermission(user, 'ranges', 'createIssn')) {
          const queries = [
            {
              query: {prefix: doc.prefix}
            }
          ];
          const rangeIssnLlist = await rangesISSNInterface.query(db, {queries});
          const isActiveRange = rangeIssnLlist.results.some(item => item.active === true);

          if (isActiveRange === true) { // eslint-disable-line functional/no-conditional-statement
            throw new ApiError(HttpStatus.NOT_ACCEPTABLE);
          }

          const newDoc = {
            ...doc,
            next: calculateNext(doc.prefix, doc.rangeStart),
            free: `${Number(doc.rangeEnd) - Number(doc.rangeStart)}`,
            taken: '0',
            active: true,
            canceled: 0,
            isClosed: false,
            created: {user: user.id}
          };

          if (validateRange(rangeIssnLlist, newDoc)) {
            return rangesISSNInterface.create(db, newDoc, user);
          }

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

  async function createIsmn(db, doc, user) {
    if (Object.keys(doc).length === 0) { // eslint-disable-line functional/no-conditional-statement
      throw new ApiError(HttpStatus.BAD_REQUEST);
    }
    try {
      const newDoc = formatPayloadCreateIsmn(doc);
      if (validateDoc(newDoc, 'RangeIsmnContent')) {
        if (hasPermission(user, 'ranges', 'createIsmn')) {
          const query = {
            prefix: doc.prefix,
            category: doc.category,
            rangeStart: doc.rangeStart
          };
          const queryResponse = await rangesIsmnInterface.queryAllRecords(db, {query});
          if (queryResponse.length === 0) {
            const result = await rangesIsmnInterface.create(db, {
              ...newDoc,
              created: {user: user.id}
            }, user);
            return result;
          }
          throw new ApiError(HttpStatus.CONFLICT);
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

  async function createIsmnSubRange(db, doc, user) {
    const {id, rangeId} = doc;
    try {
      if (hasPermission(user, 'ranges', 'createSubRange')) {
        const range = await rangesIsmnInterface.read(db, rangeId);
        if (range) {
          const {prefix, rangeEnd, category, next, free, taken, active} = range;
          if (Number(rangeEnd) + 1 !== Number(next)) {
            const payload = {
              publisherIdentifier: '', // Value Changes after calculation
              publisherId: id,
              ismnRangeId: rangeId,
              category,
              rangeStart: '', // Value Changes after calculation
              rangeEnd: '', // Value Changes after calculation
              free: '', // Value Changes after calculation
              taken: '0',
              canceled: '0',
              deleted: '0',
              next: ``, // Value Changes after calculation
              active: true,
              isClosed: false,
              created: {user: user.id}
            };
            const newDoc = calculatePublisherIdentifier({payload, prefix, next, category});
            if (validateDoc(newDoc, 'SubRangeIsmnContent')) {
              if (active && Number(free) > 0) {
                const result = await rangesSubIsmnInterface.create(db, newDoc);
                // Values to Update Big Block
                const rangeToUpdate = {
                  ...range,
                  next: updateNext(next, 1),
                  free: `${Number(free) - 1}`,
                  taken: `${Number(taken) + 1}`
                };
                const response = await updateIsmnRange(db, rangeId, rangeToUpdate, user); // Updates big Range block
                if (response) {
                  return result;
                }
                throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR);
              }
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

  async function revokeIsmnSubRange(db, {queries}, user) {
    try {
      if (hasPermission(user, 'ranges', 'revokeIsmnSubRange')) {
        const subRangeTobeRevoked = await rangesSubIsmnInterface.queryAllRecords(db, {query: queries[0].query});
        if (subRangeTobeRevoked) {
          const {publisherIdentifier, category, id, publisherId, ismnRangeId} = subRangeTobeRevoked[0]; // eslint-disable-line prefer-destructuring
          const responesIsmnRange = await rangesIsmnInterface.read(db, ismnRangeId);
          const newDoc = {
            identifier: publisherIdentifier,
            category,
            rangeId: id,
            publisherId,
            created: {user: user.id}
          };
          const {_id, ...ismnRange} = responesIsmnRange;
          if (validateDoc(newDoc, 'SubRangeIsmnCancel')) {
            const responseDeleteSubRange = await rangesSubIsmnInterface.remove(db, id);
            const newIsbnRange = {
              ...ismnRange,
              free: (Number(ismnRange.free) + 1).toString(),
              // eslint-disable-next-line no-nested-ternary
              next: ismnRange.next === 'N/A'
                ? ismnRange.rangeEnd
                : Number(ismnRange.next) - 1 <= Number(ismnRange.rangeEnd)
                  ? (Number(ismnRange.next) - 1).toString()
                  : 'N/A',
              canceled: (Number(ismnRange.canceled) + 1).toString(),
              active: true,
              taken: Number(ismnRange.taken) - 1 < Number(ismnRange.rangeEnd) - Number(ismnRange.rangeStart) ? (Number(ismnRange.taken) - 1).toString() : '0'
            };

            if (responseDeleteSubRange) {
              const responseIsmnRangeUpdate = await rangesIsmnInterface.update(db, _id, newIsbnRange, user);
              if (responseIsmnRangeUpdate) {
                const responseRevokedRecord = await subRangeIsmnCanceledInterface.create(db, newDoc);
                if (responseRevokedRecord) {
                  const responseReadPublisher = await publisherInterface.read(db, publisherId);
                  const newPublisher = {
                    ...responseReadPublisher,
                    publisherRangeId: responseReadPublisher.publisherRangeId.filter(item => item !== id),
                    publisherIdentifier: responseReadPublisher.publisherIdentifier.filter(item => item !== publisherIdentifier)
                  };
                  const responsePublisherUpdate = await publisherInterface.update(db, publisherId, newPublisher, user);
                  if (responsePublisherUpdate) {
                    return responsePublisherUpdate;
                  }
                }
              }

            }
          }
          throw new ApiError(HttpStatus.BAD_REQUEST);
        }
      }
    } catch (err) {
      throw new ApiError(err.status);
    }
  }

  async function readIsmnSubRange(db, id, user) {
    try {
      if (hasPermission(user, 'ranges', 'readSubRange')) {
        const result = await rangesSubIsmnInterface.read(db, id);
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

  async function queryIsmnSubRanges(db, {queries}, user) {
    try {
      if (hasPermission(user, 'ranges', 'querySubRanges')) {
        const result = await rangesSubIsmnInterface.query(db, {queries});
        return result;
      }
      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status);
      }
    }
  }

  async function createRangesIsmnBatch(db, doc, user) {
    try {
      if (hasPermission(user, 'ranges', 'createRangesIsmnBatch')) {
        const {id, isbnIsmn, publisherId} = doc;

        if (isbnIsmn.type === 'music') {
          const subRangeInfo = await rangesSubIsmnInterface.read(db, id);
          const initialFormatDetailsArray = manageFormatDetails(isbnIsmn.formatDetails);
          const response = isbnIsmn.identifier && isbnIsmn.identifier.length > 0
            ? initialFormatDetailsArray.filter(item => !isbnIsmn.identifier.map(i => i.type).includes(item))
            : initialFormatDetailsArray;
          const batchLength = Number(subRangeInfo.next) + response.length > Number(subRangeInfo.rangeEnd)
            ? Number(subRangeInfo.free) : response.length;
          const formatDetailsArray = response.slice(0, batchLength);

          // Condition if next + count is still inside rangeEnd needs to know the condition if not
          const batch = {
            identifierType: 'ISMN',
            identifierCount: formatDetailsArray.length,
            identifierCanceledCount: 0,
            identifierDeletedCount: 0,
            publisherId,
            publicationId: isbnIsmn._id,
            publisherIdentifierRangeId: id,
            created: {user: user.id}
          };
          const batchId = await rangesBatchInterface.create(db, batch, user);
          const responseBatch = await rangesBatchInterface.read(db, batchId);
          // Calculate Publication identifier and create ranges for respective formatDetails in One batch
          formatDetailsArray.map(async (item, index) => {
            if (subRangeInfo.active) {
              const calculateNextValue = `${subRangeInfo.publisherIdentifier}-${subRangeInfo.next}`;
              const payload = {
                identifier: calculatePublicationIdentifier(calculateNextValue, subRangeInfo.category, index, 'ismn'),
                identifierBatchId: batchId,
                publisherIdentifierRangeId: responseBatch.publisherIdentifierRangeId,
                publicationType: item
              };
              const result = await rangesIdentifierInterface.create(db, payload, user);
              if (result) {
                const subRangedoc = {
                  ...subRangeInfo,
                  taken: `${Number(subRangeInfo.taken) + formatDetailsArray.length}`,
                  free: `${Number(subRangeInfo.free) - formatDetailsArray.length}`,
                  next: updateNext(subRangeInfo.next, formatDetailsArray.length),
                  active: !(Number(subRangeInfo.next) + index + 1 > Number(subRangeInfo.rangeEnd))
                };
                return rangesSubIsmnInterface.update(db, id, subRangedoc, user);
              }
            }
            throw new ApiError('Selected Range is inactive!!!');
          });

          const queries = [
            {
              query: {identifierBatchId: batchId}
            }
          ];
          const currentIdentifier = await rangesIdentifierInterface.query(db, {queries});
          if (currentIdentifier.results) {
            const {_id, ...publicationToUpdate} = { // eslint-disable-line no-unused-vars
              ...isbnIsmn,
              associatedRange: filterDuplicateValueInArray(currentIdentifier.results.map(item => ({id: item.publisherIdentifierRangeId, subRange: subRangeInfo.publisherIdentifier}))),
              identifier: currentIdentifier.results.map(item => ({id: item.identifier, type: item.publicationType}))
            };
            const finalResult = await publicationsInterface.update(db, isbnIsmn._id, publicationToUpdate, user);
            return finalResult;
          }
        }
        throw new ApiError(HttpStatus.BAD_REQUEST);
      }

      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status);
      }
    }
  }


  function updateIsmnRange(db, id, doc, user) {
    try {
      if (Object.keys(doc).length === 0) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(HttpStatus.BAD_REQUEST);
      }
      if (validateDoc(doc, 'RangeIsmnContent')) {
        if (hasPermission(user, 'ranges', 'updateRange')) {
          return rangesIsmnInterface.update(db, id, doc, user);
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

  async function queryIsmnRanges(db, {queries}, user) {
    try {
      if (hasPermission(user, 'ranges', 'queryRanges')) {
        const result = await rangesIsmnInterface.query(db, {queries});
        return result;
      }

      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status);
      }
    }
  }

  async function readIssn(db, id, user) {
    try {
      if (hasPermission(user, 'ranges', 'readIssn')) {
        const result = await rangesISSNInterface.read(db, id);
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

  function updateIssn(db, id, doc, user) {
    try {
      if (Object.keys(doc).length === 0) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(HttpStatus.BAD_REQUEST);
      }

      if (validateDoc(doc, 'RangeIsmnContent')) {
        if (hasPermission(user, 'ranges', 'updateIssn')) {
          return rangesISSNInterface.update(db, id, doc, user);
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

  function queryIssn(db, {queries}, user) {
    try {
      if (hasPermission(user, 'ranges', 'queryIssn')) {
        return rangesISSNInterface.query(db, {queries});
      }

      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status);
      }
    }
  }

  function queryIssnStatistics(db, query, user) {
    try {
      if (hasPermission(user, 'ranges', 'queryIssn')) {
        return rangesISSNInterface.queryAllRecords(db, query);
      }

      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status);
      }
    }
  }

  async function assignIssnRange(db, doc, user) {
    try {
      if (hasPermission(user, 'ranges', 'assignIssnRange')) {
        const {rangeBlockId, issn} = doc;
        const rangeDetails = await rangesISSNInterface.read(db, rangeBlockId);
        const {formatDetails} = issn;
        const newIssn = {
          ...filterResult(issn),
          id: issn._id,
          associatedRange: [{id: rangeBlockId, block: rangeDetails.prefix}],
          identifier: await getIdentifier(formatDetails, rangeDetails)
        };
        if (validateDoc(newIssn, 'PublicationIssn')) {
          const issnUpdateResponse = await publicationsIssnInterface.update(db, newIssn.id, newIssn, user);
          if (issnUpdateResponse.lastErrorObject.updatedExisting) {
            return HttpStatus.OK;
          }

          throw new ApiError(HttpStatus.NOT_ACCEPTABLE);
        }
        throw new ApiError(HttpStatus.BAD_REQUEST);
      }

      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status ? err.status : HttpStatus.BAD_REQUEST);
      }
    }

    function filterResult(result) {
      return Object.entries(result)
        .filter(([key]) => key === '_id' === false)
        .reduce((acc, [
          key,
          value
        ]) => ({...acc, [key]: value}), {});
    }

    async function getIdentifier(formatDetails, rangeDetails) {
      const {prefix, next} = rangeDetails;
      if (formatDetails.length === 1) {
        const identifier = [
          {
            id: `${prefix}-${next}`,
            type: formatDetails[0].format
          }
        ];
        const newRangeDetails = {
          ...filterResult(rangeDetails),
          next: calculateNext(prefix, next.slice(0, 3), 1),
          free: `${Number(rangeDetails.free) - 1}`,
          taken: `${Number(rangeDetails.taken) + 1}`,
          active: !(Number(rangeDetails.next) + 1 > Number(rangeDetails.rangeEnd))
        };
        const updateRangeDetails = await rangesISSNInterface.update(db, rangeDetails._id, newRangeDetails, user);
        if (updateRangeDetails.lastErrorObject.updatedExisting) {
          return identifier;
        }

        throw new ApiError(HttpStatus.NOT_ACCEPTABLE);
      }

      if (formatDetails.length > 1) {
        const array = formatDetails.map(item => item.format);
        const identifier = array.reduce((acc, item, index) => {
          acc.push({ // eslint-disable-line functional/immutable-data
            id: `${prefix}-${calculateNext(prefix, next.slice(0, 3), index)}`,
            type: item
          });
          return acc;
        }, []);
        const newRangeDetails = {
          ...filterResult(rangeDetails),
          next: calculateNext(prefix, next.slice(0, 3), 2),
          free: `${Number(rangeDetails.free) - 2}`,
          taken: `${Number(rangeDetails.taken) + 2}`,
          active: !(Number(rangeDetails.next) + 3 > Number(rangeDetails.rangeEnd))
        };
        const updateRangeDetails = await rangesISSNInterface.update(db, rangeDetails._id, newRangeDetails, user);
        if (updateRangeDetails.lastErrorObject.updatedExisting) {
          return identifier;
        }

        throw new ApiError(HttpStatus.NOT_ACCEPTABLE);
      }
    }
  }

  async function revokeIdentifier(db, {queries, subRangeId}, user) {
    try {
      if (hasPermission(user, 'ranges', 'revokeIdentifier')) {
        const response = await rangesIdentifierInterface.query(db, {queries});
        const {id, identifierBatchId} = response.results[0]; // eslint-disable-line prefer-destructuring
        const batchResponse = await rangesBatchInterface.queryAllRecords(db, {query: {_id: new ObjectId(identifierBatchId)}});
        const {identifierType} = batchResponse[0]; // eslint-disable-line prefer-destructuring
        const result = await rangesIdentifierInterface.remove(db, id);
        if (result) {
          if (identifierType === 'ISBN') {
            const prevSubRange = await rangesSubIsbnInterface.read(db, subRangeId);
            const newSubRange = {
              ...prevSubRange,
              canceled: (Number(prevSubRange.canceled) + 1).toString()
            };

            const updateSubRangeResult = await rangesSubIsbnInterface.update(db, subRangeId, newSubRange, user);
            if (updateSubRangeResult) {
              return result;
            }
            throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR);
          }

          if (identifierType === 'ISMN') {
            const {_id, ...prevSubRange} = await rangesSubIsmnInterface.read(db, subRangeId); // eslint-disable-line no-unused-vars
            const newSubRange = {
              ...prevSubRange,
              canceled: (Number(prevSubRange.canceled) + 1).toString()
            };

            const updateSubRangeResult = await rangesSubIsmnInterface.update(db, subRangeId, newSubRange, user);
            if (updateSubRangeResult) {
              return result;
            }
            throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR);
          }
        }
        throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR);
      }
      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      throw new ApiError(err.status);
    }
  }


  function calculateNext(prefix, next, i = 0) {
    const nextValue = formatNext(next, i);
    const combine = prefix.concat(nextValue).split('');
    const sum = combine.reduce((acc, item, index) => {
      const m = (combine.length + 1 - index) * item;
      acc = Number(acc) + Number(m); // eslint-disable-line no-param-reassign
      return acc;
    }, 0); // Get the remainder and calculate it to return the actual check digit

    const remainder = sum % 11;

    if (remainder === 0) {
      const checkDigit = '0';
      return `${nextValue}${checkDigit}`;
    }

    const diff = 11 - remainder;
    const checkDigit = diff === 10 ? 'X' : diff.toString();
    return `${nextValue}${checkDigit}`;

    function formatNext(value, i) {
      const N = Number(value) + i;
      switch (`${N}`.length) {
      case 3:
        return `${N}`;
      case 2:
        return `0${N}`;
      case 1:
        return `00${N}`;
      default:
        return `${N}`;
      }
    }
  }
}
