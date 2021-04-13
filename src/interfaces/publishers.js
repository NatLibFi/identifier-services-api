/* eslint-disable max-statements */

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

import {ApiError} from '@natlibfi/identifier-services-commons';
import HttpStatus from 'http-status';
import interfaceFactory from './interfaceModules';
import {hasPermission, validateDoc} from './utils';

const publisherInterface = interfaceFactory('PublisherMetadata', 'PublisherContent');
const rangesIsbnBatchInterface = interfaceFactory('RangeIsbnBatch');
const rangesIsmnBatchInterface = interfaceFactory('RangeIsmnBatch');

export default function () {
  return {
    create,
    read,
    update,
    query,
    queryAll,
    queryAllPublishers,
    queryAllRecords
  };

  async function create(db, doc, user) {
    try {
      if (validate(doc)) {
        if (hasPermission(user, 'publishers', 'create')) {
          const newDoc = filterResult(doc);
          const result = await publisherInterface.create(db, newDoc, user);
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
    function validate (doc) {
      if (doc.requestPublicationType === 'issn' || doc.requestPublicationType === 'isbn-ismn') {
        return validateDoc(doc, 'PublisherISBN_ISMN_ISSN');
      }
      if (doc.requestPublicationType === 'dissertation') {
        return validateDoc(doc, 'Publisher_ISBN_ISMN_Dissertation');
      }
      return validateDoc(doc, 'PublisherContent');
    }

    function filterResult(result) {
      return Object.entries(result)
        .filter(([key]) => key === 'requestPublicationType' === false)
        .reduce((acc, [
          key,
          value
        ]) => ({...acc, [key]: value}), {});
    }
  }

  async function read(db, id, user) {
    try {
      const protectedProperties = determineProtectedProperties();

      const result = await publisherInterface.read(db, id, protectedProperties);
      if (result) {
        if (user === undefined && result.postalAddress.public === true) {
          return result;
        }
        if (user === undefined && result.postalAddress.public === false) {
          const filteredResult = filterResult(result);
          return filteredResult;
        }
        return result;
      }
      throw new ApiError(HttpStatus.NOT_FOUND);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status ? err.status : HttpStatus.BAD_REQUEST);
      }
    }
    function filterResult(result) {
      return Object.entries(result)
        .filter(([key]) => key === 'postalAddress' === false)
        .reduce((acc, [
          key,
          value
        ]) => ({...acc, [key]: value}), {});
    }
    function determineProtectedProperties() {
      if (user === undefined) {
        return {publicationDetails: 0, language: 0, metadataDelivery: 0, primaryContact: 0, activity: 0};
      }
      if (user.role === 'publisher-admin') {
        return {publicationDetails: 0, metadataDelivery: 0, activity: 0};
      }
    }

  }

  function update(db, id, doc, user) {
    return publisherInterface.update(db, id, doc, user);
  }

  function query(db, {queries, offset, sort}) {
    return publisherInterface.query(db, {queries, offset, sort});
  }

  async function queryAll(db) {
    const result = await publisherInterface.queryAll(db);
    return result.reduce((acc, item) => { // eslint-disable-line array-callback-return
      if ((item.publisherType === 'P' || item.publisherType === 'T') && item.selfPublisher === false) { // eslint-disable-line functional/no-conditional-statement
        acc = [ // eslint-disable-line no-param-reassign
          ...acc,
          {value: item._id, label: `${item.name}(${item.email})`, email: item.email}
        ];
      }
      return acc;
    }, []);
  }

  async function queryAllPublishers(db, {query}) {
    try {
      const {identifierType, type} = query;

      if (type) {
        const publishersList = await publisherInterface.queryAllRecords(db, {query: type});
        const filtered = publishersList.filter(i => i.publisherRangeId);
        return run(db, filtered, identifierType);
      }
      const publishersList = await publisherInterface.queryAll(db);
      if (identifierType) {
        const filtered = publishersList.filter(i => i.publisherRangeId);
        return run(db, filtered, identifierType);
      }
      return publishersList;

    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status);
      }
    }
  }

  function queryAllRecords(db, {queries}) {
    try {
      return publisherInterface.queryAllRecords(db, {query: queries});
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status);
      }
    }
  }

  async function run (db, filtered, identifierType) {
    const rangeInterface = identifierType === 'isbn'
      ? rangesIsbnBatchInterface
      : rangesIsmnBatchInterface;
    const result = await filter(filtered, async publisher => {
      const res = await doAsyncStuff(db, publisher, rangeInterface);
      if (res) {
        return publisher;
      }
    });

    return result;
  }

  // Arbitrary asynchronous function
  async function doAsyncStuff(db, publisher, rangeInterface) {
    const batchResult = await rangeInterface.queryAll(db);
    const publisherRangeIdArray = publisher.publisherRangeId;
    const res = publisherRangeIdArray.reduce((acc, id) => {
      acc = batchResult.some(batch => batch.publisherId === id); // eslint-disable-line no-param-reassign
      return acc;
    }, false);
    return res;
  }

  // Helper Function
  async function filter(arr, callback) {
    const fail = Symbol('symbol');
    return (await Promise.all(arr.map(async item => await callback(item) ? item : fail))).filter(i => i !== fail);
  }
}
