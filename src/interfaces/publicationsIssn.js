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
import {ApiError, Utils} from '@natlibfi/identifier-services-commons';

import interfaceFactory from './interfaceModules';
import {hasPermission, validateDoc} from './utils';

const publicationsIssnInterface = interfaceFactory('Publication_ISSN', 'PublicationIssnContent');
const rangesISSNInterface = interfaceFactory('RangeIssnContent');
const {calculateNewISSN} = Utils;

export default function () {
  return {
    createISSN,
    readISSN,
    updateISSN,
    // RemoveISSN,
    queryISSN
  };

  async function createISSN(db, doc, user) {
    try {
      if (doc.request) {
        const newDoc = {
          ...doc,
          metadataReference: {state: 'pending'}
        };
        if (validateDoc(newDoc, 'PublicationIssnContent')) {
          return publicationsIssnInterface.create(db, newDoc, user);
        }
        throw new ApiError(HttpStatus.FORBIDDEN);
      }

      const rangeQueries = {queries: [{query: {active: true}}], offset: null};
      const identifierLists = await rangesISSNInterface.query(db, rangeQueries);
      const index = 0;
      const {results} = identifierLists;
      const activeRange = results[index];
      const queries = [
        {
          query: {associatedRange: activeRange.id}
        }
      ];
      const publicationList = await publicationsIssnInterface.query(db, {queries, offset: null});
      const array = publicationList.results.map(item => item.identifier);
      const newPublication = calculateNewISSN(array);
      const newDoc = {
        ...doc,
        metadataReference: {state: 'pending'},
        associatedRange: activeRange.id,
        identifier: newPublication
      };
      if (validateDoc(newDoc, 'PublicationIssnContent')) {
        if (hasPermission(user, 'publicationIssn', 'createISSN')) {
          const newDocWithPublisher = {...newDoc, publisher: user.publisher};
          return publicationsIssnInterface.create(db, newDocWithPublisher, user);
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

  async function readISSN(db, id, user) {
    try {
      const result = await publicationsIssnInterface.read(db, id);
      if (hasPermission(user, 'publicationIssn', 'readISSN')) {
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

  function updateISSN(db, id, doc, user) {
    try {
      if (Object.keys(doc).length === 0) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(HttpStatus.BAD_REQUEST);
      }

      if (validateDoc(doc, 'PublicationIssnContent')) {
        if (hasPermission(user, 'publicationIssn', 'updateISSN')) {
          return publicationsIssnInterface.update(db, id, doc, user);
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

  // Async function removeISSN(db, id) {
  // Const result = await publicationsIssnInterface.remove(db, id);
  // Return result;
  // }

  async function queryISSN(db, {queries, offset}, user) {
    const result = await publicationsIssnInterface.query(db, {queries, offset});
    if (hasPermission(user, 'publicationIssn', 'queryISSN')) {
      if (user.role === 'publisher-admin' || user.role === 'publisher') {
        const queries = [
          {
            query: {publisher: user.publisher}
          }
        ];
        return publicationsIssnInterface.query(db, {queries, offset});
      }

      return result;
    }

    if (user) {
      return result.results.filter(item => item.publisher === user.id);
    }

    throw new ApiError(HttpStatus.FORBIDDEN);
  }
}
