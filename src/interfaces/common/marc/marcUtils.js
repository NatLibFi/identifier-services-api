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

/* Publication to MARC conversion is based on original work by Petteri Kivimäki (Identifier Registry) */

import sequelize from '../../../models';
import HttpStatus from 'http-status';

import abstractModelInterface from '../abstractModelInterface';
import {ApiError} from '../../../utils';
import {ISBN_REGISTRY_FORMATS, COMMON_REGISTRY_TYPES, COMMON_IDENTIFIER_TYPES} from '../../constants';
import {convertToMarcIsbnIsmn} from '../../isbn-registry/marc';
import {convertToMarcIssn} from '../../issn-registry/marc';

const publicationIssnModel = sequelize.models.publicationIssn;
const publicationIssnModelInterface = abstractModelInterface(publicationIssnModel);

const publicationIsbnModel = sequelize.models.publicationIsbn;
const publicationIsbnModelInterface = abstractModelInterface(publicationIsbnModel);

/**
 * Wrapper for constructing MARC record from either ISBN or ISSN registry information.
 * @param {Object} rawInformation Information used for constructing MARC record
 * @returns {Array} Array of MARC records
 */
export function convertToMarc({registry, publication, publisher, form}) {
  if (registry === COMMON_REGISTRY_TYPES.ISBN_ISMN) {
    // May produce one or more records depending whether type is PRINT, ELECTRONICAL or PRINT_ELECTRONICAL
    // Each electronical distinct type will produce new record
    if (publication.publicationFormat !== ISBN_REGISTRY_FORMATS.PRINT) {
      if (publication.publicationFormat === ISBN_REGISTRY_FORMATS.PRINT_ELECTRONICAL) {
        return [
          convertToMarcIsbnIsmn(publication), // Print
          ...publication.fileformat.map(electronicalRecordPublicationType => convertToMarcIsbnIsmn(publication, electronicalRecordPublicationType)) // All electronical types
        ];
      }

      // All electronical types
      return publication.fileformat.map(electronicalRecordPublicationType => convertToMarcIsbnIsmn(publication, electronicalRecordPublicationType));
    }

    // Print record only
    return [convertToMarcIsbnIsmn(publication)];
  }

  if (registry === COMMON_REGISTRY_TYPES.ISSN) {
    return [convertToMarcIssn({publication, publisher, form})];
  }

  throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'MARC generation does not support selected registry type');
}

// Retrieves publication identifiers for selected publication in selected registry
/* istanbul ignore next */
export async function getRecordIdentifiers({registry, publicationId}) {
  if (registry === COMMON_REGISTRY_TYPES.ISBN_ISMN) {
    return getIsbnRegistryPublicationIdentifiers(publicationId);
  }

  if (registry === COMMON_REGISTRY_TYPES.ISSN) {
    return getIssnRegistryPublicationIdentifiers(publicationId);
  }

  throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'Identifier services search from Melinda functionality does not support selected registry type');

  /**
   * Get identifiers of publication from ISBN registry
   * @param id ISBN-registry publication id
   * @return Object containing identifier type string and array of strings containing ISBN/ISMN identifiers of publication
   */
  async function getIsbnRegistryPublicationIdentifiers(id) {
    const readResult = await publicationIsbnModelInterface.read(id);
    if (!readResult.publicationIdentifierPrint && !readResult.publicationIdentifierElectronical) {
      throw new ApiError(HttpStatus.CONFLICT, 'Publication does not have identifiers associated with it');
    }

    return parseIdentifiers(readResult);

    function parseIdentifiers(publication) {
      const electronicalIdentifiersObject = publication.publicationIdentifierElectronical ? JSON.parse(publication.publicationIdentifierElectronical) : {};
      const printIdentifiersObject = publication.publicationIdentifierPrint ? JSON.parse(publication.publicationIdentifierPrint) : {};

      return {type: publication.publicationIdentifierType, identifiers: Object.keys({...electronicalIdentifiersObject, ...printIdentifiersObject})};
    }
  }

  /**
   * Get identifiers of publication from ISSN registry
   * @param id ISSN-registry publication id
   * @return Object containing identifier type string and array of strings containing ISSN identifiers of publication
   */
  async function getIssnRegistryPublicationIdentifiers(id) {
    const readResult = await publicationIssnModelInterface.read(id);
    if (!readResult.issn) {
      throw new ApiError(HttpStatus.CONFLICT, 'Publication does not have identifiers associated with it');
    }

    return {type: COMMON_IDENTIFIER_TYPES.ISSN, identifiers: [readResult.issn]};
  }
}
