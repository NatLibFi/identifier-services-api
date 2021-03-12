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

import {createApiClient} from '@natlibfi/melinda-rest-api-client';


import {hasPermission} from './utils';
import {
  MELINDA_RECORD_IMPORT_PASSWORD,
  MELINDA_RECORD_IMPORT_USERNAME,
  MELINDA_API_URL
} from '../config';

const client = createApiClient({restApiPassword: MELINDA_RECORD_IMPORT_PASSWORD, restApiUsername: MELINDA_RECORD_IMPORT_USERNAME, restApiUrl: MELINDA_API_URL});

export default function () {
  return {
    read
  };

  async function read(id, user) {
    try {
      if (hasPermission(user, 'marc', 'read')) {
        const result = await client.read(id);
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
}
