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

/* Based on original work by Petteri Kivimäki https://github.com/petkivim/ (Identifier Registry) */

import HttpStatus from 'http-status';

import sequelize from '../../models';
import {ApiError} from '../../utils';

/**
 * ISBN publisher archive entries interface. Contains query operation.
 * @returns Interface to interact with ISBN-registry publisher archive entries that are part of publisher registry
 */
export default function () {
  const publisherIsbnArchiveRecordModel = sequelize.models.publisherIsbnArchiveRecord;

  return {
    query
  };

  async function query(publisherId) {

    const result = await publisherIsbnArchiveRecordModel.findAndCountAll({
      where: {
        publisherId
      }
    });

    if (result.count === 0) {
      throw new ApiError(HttpStatus.NOT_FOUND);
    }

    if (result.count > 1) {
      throw new ApiError(HttpStatus.CONFLICT, `Found ${result.count} archive entries for publisherId ${publisherId}`);
    }

    return result.rows[0].toJSON();
  }
}
