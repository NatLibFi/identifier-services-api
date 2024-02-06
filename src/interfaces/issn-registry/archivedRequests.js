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
import {transformIssnPublicationFromDb} from './utils';

/**
 * Issn registry form archive interface. Contains read operation for archive information to be able to be read.
 * Deletion of archive entries is done through the ISSN registry form interface as the archive entry is deleted when
 * the associated form entry is deleted.
 * @returns Interface to interact with ISSN form archive
 */
export default function () {
  const issnFormArchiveModel = sequelize.models.issnFormArchive;

  return {
    search
  };

  /**
   * Search arhived form using the form id
   * @param {Object} searchParams Search parameters, formId
   * @returns FormArchive object
   */
  async function search({formId}) {
    const result = await issnFormArchiveModel.findAll({
      where: {
        formId
      }
    });

    if (result && result.length > 0) {
      if (result.length !== 1) {
        throw new ApiError(HttpStatus.CONFLICT, 'There exists more than one archive entry for the form');
      }

      return transformIssnPublicationFromDb(result[0].toJSON());
    }

    throw new ApiError(HttpStatus.NOT_FOUND);
  }
}
