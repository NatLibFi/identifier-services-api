/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file.
 *
 * API microservice of Identifier Services
 *
 * Copyright (C) 2019 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of identifier-services-api
 *
 * identifier-services-api program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * identifier-services-api is distributed in the hope that it will be useful,
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

import HttpStatus from 'http-status';
import {ApiError} from '@natlibfi/identifier-services-commons';

import interfaceFactory from './interfaceModules';
import {hasPermission, validateDoc} from './utils';

const publicationsIsbnIsmnInterface = interfaceFactory('Publication_ISBN_ISMN', 'PublicationIsbnIsmnContent');
const rangesISBNInterface = interfaceFactory('RangeIsbnContent', 'RangeIsbnContent');
const rangesISMNInterface = interfaceFactory('RangeIsmnContent', 'RangeIsmnContent');

export default function () {
  return {
    createIsbnIsmn,
    readIsbnIsmn,
    updateIsbnIsmn,
    queryIsbnIsmn
  };

  async function createIsbnIsmn(db, doc, user) {
    const query = [
      {
        query: {active: true}
      }
    ];
    const queryPubIsbn = [
      {
        query: {$or: [
          {type: 'book'},
          {type: 'dissertation'},
          {type: 'map'}
        ]}
      }
    ];
    const queryPubIsmn = [
      {
        query: {$or: [{type: 'music'}]}
      }
    ];
    const isbnRangeList = await rangesISBNInterface.query(db, {queries: query});
    const ismnRangeList = await rangesISMNInterface.query(db, {queries: query});
    // Get list of publication according to type either music or book...
    const publicationList = await publicationsIsbnIsmnInterface.query(db, {queries: doc.type === 'music' ? queryPubIsmn : queryPubIsbn});
    const publicationIdentifier = publicationList.results.map(item => item.identifier);
    const identiferTitle = publicationIdentifier.reduce((acc, cVal) => acc.concat(cVal), []);
    // Get list of title if identifiers
    const slicedTitle = identiferTitle.map(item => item.id.slice(11, 15)); // ['0001', '0002', '0003']
    const intIdentifierTitle = slicedTitle.map(item => Number(item));
    const newIdentifierTitle = Math.max(...intIdentifierTitle) + 1;

    // Get ranges according to the associated user
    function getRange(ranges) {
      return ranges.find(item => item.associatePublisher && item.associatePublisher.some(range => range === user.id));
    }

    function calculateIsbnIsmnIdentifier(range, title) {
      const beforeCheckDigit = `${range.prefix}${title}`;
      const split = beforeCheckDigit.split('');
      const calculateMultiply = split.map((item, i) => {
        if (i === 0 || i % 2 === 0) {
          return Number(item);
        }

        return Number(item * 3);
      });
      const addTotal = calculateMultiply.reduce((acc, val) => acc + val, 0);
      const remainder = addTotal % 10;
      const checkDigit = 10 - remainder;
      const formatIdentifier = `${beforeCheckDigit.slice(0, 3)}-${
        beforeCheckDigit.slice(3, 6)}-${
        beforeCheckDigit.slice(6, 8)}-${
        beforeCheckDigit.slice(8, 12)}-${
        checkDigit}`;
      return formatIdentifier;
    }

    try {
      if (Object.keys(doc).length === 0) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(HttpStatus.BAD_REQUEST);
      }

      const range = doc.type === 'music' ? getRange(ismnRangeList.results) : getRange(isbnRangeList.results);

      const newDoc = {
        ...doc,
        associatedRange: range && range.id,
        metadataReference: {state: 'pending'},
        identifier: range && calculateIdentifier({newIdentifierTitle, range, doc})
      };

      if (validateDoc(user.role === 'system' ? doc : newDoc, 'PublicationIsbnIsmnContent')) {
        if (hasPermission(user, 'publicationIsbnIsmn', 'createIsbnIsmn')) {
          return publicationsIsbnIsmnInterface.create(db, user.role === 'system' ? doc : newDoc, user);
        }

        throw new ApiError(HttpStatus.FORBIDDEN);
      }

      throw new ApiError(HttpStatus.BAD_REQUEST);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status ? err.status : HttpStatus.BAD_REQUEST);
      }
    }

    function calculateIdentifier({newIdentifierTitle, range, doc}) {
      if (doc.formatDetails.format === 'electronic' || doc.formatDetails.format === 'printed') {
        return {
          id: calculateIsbnIsmnIdentifier(range, newIdentifierTitle),
          type: doc.formatDetails.format
        };
      }

      if (doc.formatDetails.format === 'printed-and-electronic') {
        const identifier = [
          newIdentifierTitle,
          newIdentifierTitle + 1
        ];
        const res = identifier.map((item, i) => ({
          id: calculateIsbnIsmnIdentifier(range, item),
          type: i === 0 ? 'printed' : 'electronic'
        }));
        return res;
      }
    }
  }

  async function readIsbnIsmn(db, id, user) {
    try {
      const result = await publicationsIsbnIsmnInterface.read(db, id);
      if (hasPermission(user, 'publicationIsbnIsmn', 'readIsbnIsmn')) {
        if (result) {

          if (user.role === 'publisher-admin') {
            if (user.publisher === result.publisher) {
              return result;
            }
            throw new ApiError(HttpStatus.FORBIDDEN);
          }
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

  function updateIsbnIsmn(db, id, doc, user) {
    try {
      if (Object.keys(doc).length === 0) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(HttpStatus.BAD_REQUEST);
      }

      if (validateDoc(doc, 'PublicationIsbnIsmnContent')) {
        if (hasPermission(user, 'publicationIsbnIsmn', 'updateIsbnIsmn')) {
          return publicationsIsbnIsmnInterface.update(db, id, doc, user);
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

  /* Async function removeIsbnIsmn(db, id) {
  if (hasAdminPermission(user) || hasSystemPermission(user)) {
    const result = await publicationsIsbnIsmnInterface.remove(db, id);
    return result;
  }

  throw new ApiError(HttpStatus.FORBIDDEN);
  } */

  async function queryIsbnIsmn(db, {queries, offset}, user) {
    const result = await publicationsIsbnIsmnInterface.query(db, {queries, offset});
    if (hasPermission(user, 'publicationIsbnIsmn', 'queryIsbnIsmn')) {
      if (user.role === 'publisher-admin' || user.role === 'publisher') {
        const queries = [
          {
            query: {publisher: user.publisher}
          }
        ];
        return publicationsIsbnIsmnInterface.query(db, {queries, offset});
      }

      return result;
    }

    if (user) {
      return result.results.filter(item => item.publisher === user.id);
    }

    throw new ApiError(HttpStatus.FORBIDDEN);
  }
}
