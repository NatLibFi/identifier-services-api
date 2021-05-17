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

const messageInterface = interfaceFactory('Messages');

export default function () {
  return {
    create,
    read,
    query,
    queryAllRecords
  };

  async function create(db, doc, user) {
    try {
      if (validateDoc(doc, 'MessageContent')) {
        if (hasPermission(user, 'message', 'create')) {
          return await messageInterface.create(db, {...doc, body: Buffer.from(doc.body).toString('base64')}, user);
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

  async function read(db, id, user) {
    try {
      if (hasPermission(user, 'message', 'read')) {
        const result = await messageInterface.read(db, id);
        if (result) { // eslint-disable-line functional/no-conditional-statement
          return result;
        }

        throw new ApiError(HttpStatus.NOT_FOUND);
      }

      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status ? err.status : HttpStatus.BAD_REQUEST);
      }
    }
  }

  async function query(db, {queries, sort}, user) {
    try {
      if (hasPermission(user, 'message', 'query')) {
        const response = await messageInterface.queryAllRecords(db, {query: queries[0].query, sort});
        return {
          results: response,
          totalDoc: response.length
        };
      }

      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status);
      }
    }
  }

  async function queryAllRecords(db, user) {
    try {
      if (hasPermission(user, 'message', 'queryAll')) {
        const result = await messageInterface.queryAllRecords(db);
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
