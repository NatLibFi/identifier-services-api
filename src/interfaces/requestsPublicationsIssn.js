/* eslint-disable max-depth */
/* eslint-disable max-statements */
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

import {filterResult, hasPermission, validateDoc} from './utils';
import interfaceFactory from './interfaceModules';

const publicationsRequestsIssnInterface = interfaceFactory('PublicationRequest_ISSN');

export default function () {
  return {
    createRequestISSN,
    readRequestISSN,
    updateRequestISSN,
    removeRequestISSN,
    queryRequestISSN,
    queryAllRequestISSN
  };

  function createRequestISSN(db, doc, user) {
    try {
      if (Object.keys(doc).length === 0) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(HttpStatus.BAD_REQUEST);
      }

      const newDoc = {...doc, state: 'new', backgroundProcessingState: 'pending', creator: getCreator(), publicationType: 'issn'};
      if (validateDoc(newDoc, 'PublicationIssnRequestContent')) {
        if (hasPermission(user, 'publicationIssnRequests', 'createRequestISSN')) {
          return publicationsRequestsIssnInterface.create(db, newDoc, user);
        }

        throw new ApiError(HttpStatus.FORBIDDEN);
      }
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status ? err.status : HttpStatus.BAD_REQUEST);
      }
    }
    function getCreator() {
      return Object.keys(doc.publisher).length > 0
        ? doc.publisher.publisherEmail || doc.publisher.email
        : user.id;
    }
  }

  async function readRequestISSN(db, id, user) {
    try {
      const result = await publicationsRequestsIssnInterface.read(db, id);
      if (hasPermission(user, 'publicationIssnRequests', 'readRequestISSN')) {
        if (result) {
          if (user.role === 'publisher-admin' || user.role === 'publisher') {
            if (user.publisher === result.publisher) {
              const protectedProperties = {
                state: 0,
                publisher: 0,
                lastUpdated: 0
              };
              const res = await publicationsRequestsIssnInterface.read(db, id, protectedProperties);
              if (res) {
                return res;
              }
              throw new ApiError(HttpStatus.NOT_FOUND);
            }
            throw new ApiError(HttpStatus.FORBIDDEN);
          }
          return result;
        }
        throw new ApiError(HttpStatus.NOT_FOUND);
      }

      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      throw new ApiError(err.status);
    }
  }

  async function updateRequestISSN(db, id, doc, user) {
    try {
      if (Object.keys(doc).length === 0) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(HttpStatus.BAD_REQUEST);
      }

      const newDoc = {...doc, backgroundProcessingState: doc.backgroundProcessingState ? doc.backgroundProcessingState : 'pending'};
      const readResult = await readRequestISSN(db, id, user);
      if (validateDoc(newDoc, 'PublicationIssnRequestContent')) {
        if (hasPermission(user, 'publicationIssnRequests', 'updateRequestISSN')) {
          return publicationsRequestsIssnInterface.update(db, id, newDoc, user);
        }

        if (user && readResult.publisher === user.id) {
          const result = publicationsRequestsIssnInterface.update(db, id, newDoc, user);
          return filterResult(result);
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

  function removeRequestISSN(db, id, user) {
    try {
      if (hasPermission(user, 'publicationIssnRequests', 'removeRequestISSN')) {
        return publicationsRequestsIssnInterface.remove(db, id);
      }

      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status);
      }
    }
  }

  async function queryRequestISSN(db, {queries, offset, sort}, user) {
    try {
      const result = await publicationsRequestsIssnInterface.query(db, {queries, offset, sort});
      if (hasPermission(user, 'publicationIssnRequests', 'queryRequestISSN')) {
        if (user.role === 'publisher-admin' || user.role === 'publisher') {
          const protectedProperties = {
            state: 0,
            publisher: 0,
            lastUpdated: 0
          };
          const queries = [
            {
              query: {publisher: user.publisher}
            }
          ];
          return publicationsRequestsIssnInterface.query(db, {queries, offset}, protectedProperties);
        }

        return result;
      }

      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status);
      }
    }
  }

  function queryAllRequestISSN(db, {queries}, user) {
    try {
      if (hasPermission(user, 'publicationIssnRequests', 'queryRequestISSN')) {
        return publicationsRequestsIssnInterface.queryAllRecords(db, {query: queries[0].query});
      }

      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status);
      }
    }
  }
}
