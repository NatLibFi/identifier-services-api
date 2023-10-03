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

/* MARC generation from publication records is based on original work by Petteri Kivimäki (Identifier Registry) */

import HttpStatus from 'http-status';

import * as MarcRecordSerializers from '@natlibfi/marc-record-serializers';
import {createMelindaApiRecordClient as createMelindaApiClient} from '@natlibfi/melinda-rest-api-client';
import createMelindaSruClient from '@natlibfi/sru-client';

import {createLogger} from '@natlibfi/melinda-backend-commons';

import sequelize from '../../../models';
import {ApiError} from '../../../utils';
import {COMMON_IDENTIFIER_TYPES, COMMON_REGISTRY_TYPES} from '../../constants';
import {convertToMarc, getRecordIdentifiers} from './marcUtils';
import {MELINDA_API_PASSWORD, MELINDA_API_URL, MELINDA_API_USER, MELINDA_CREATE_RECORD_PARAMS, MELINDA_SRU_URL} from '../../../config';

/**
 * MARC interface for both ISBN and ISSN registries.
 * @param registry Registry to which MARC-generator to use
 * @returns Interface to interact with MARC-records
 */
export default function (registry) {
  const logger = createLogger();

  const {publicationModel} = getPublicationModelByRegistry(registry);

  // Establish Melinda connections if parameters are available
  /* eslint-disable functional/no-conditional-statements,functional/no-let */
  let melindaApiClient = false;
  let melindaSruClient = false;

  /* istanbul ignore if */
  if (MELINDA_API_URL && MELINDA_API_USER && MELINDA_API_PASSWORD) {
    logger.debug('Melinda API configuration was found');
    melindaApiClient = createMelindaApiClient({
      melindaApiUrl: MELINDA_API_URL,
      melindaApiUsername: MELINDA_API_USER,
      melindaApiPassword: MELINDA_API_PASSWORD
    });
  }

  /* istanbul ignore if */
  if (MELINDA_SRU_URL) {
    logger.debug('Melinda SRU configuration was found');
    melindaSruClient = createMelindaSruClient({url: MELINDA_SRU_URL, recordSchema: 'marcxml'});
  }
  /* eslint-enable functional/no-conditional-statements,functional/no-let */


  // Required by issn registry marc generation in addition to publication model
  const publisherIssnModel = sequelize.models.publisherIssn;
  const issnFormModel = sequelize.models.issnForm;

  return {
    getRecords,
    sendToMelinda,
    searchFromMelinda
  };

  /**
   * Get a publication sequelize model based on registry type.
   * @param {string} registryType Type of registry to fetch model for
   * @returns Sequelize model object
   */
  function getPublicationModelByRegistry(registryType) {
    const models = {};

    /* eslint-disable functional/immutable-data,functional/no-conditional-statements */
    /* istanbul ignore else */
    if (registryType === COMMON_REGISTRY_TYPES.ISBN_ISMN) {
      models.publicationModel = sequelize.models.publicationIsbn;
    } else if (registryType === COMMON_REGISTRY_TYPES.ISSN) {
      models.publicationModel = sequelize.models.publicationIssn;
    } else {
      throw new Error('Invalid registry type');
    }
    /* eslint-enable functional/immutable-data,functional/no-conditional-statements */

    return models;
  }

  /**
   * Get Array of MARC records in string format constructed from publication entity of ISBN- or ISSN-registry
   * @param {number} id ID of entity to construct MARC record from. Entity type depends of registry type.
   * @param {string} format Format to serialize the record
   * @returns {Array} Array of stringified representations of MARC records
   */
  async function getRecords(id, format = 'text') {
    const publication = await publicationModel.findByPk(id);

    /* istanbul ignore if */
    if (!publication) {
      throw new ApiError(HttpStatus.NOT_FOUND);
    }

    // In case of issn registry, form and publisher information must also be loaded
    const form = registry === COMMON_REGISTRY_TYPES.ISSN ? await issnFormModel.findByPk(publication.formId) : undefined;
    const publisher = registry === COMMON_REGISTRY_TYPES.ISSN ? await publisherIssnModel.findByPk(publication.publisherId) : undefined;

    /* istanbul ignore if */
    if (registry === COMMON_REGISTRY_TYPES.ISSN && (!form || !publisher)) {
      throw new ApiError(HttpStatus.CONFLICT, `Cannot construct MARC record for ISSN registry publication due to form and publisher information not being available`);
    }

    const opts = registry === COMMON_REGISTRY_TYPES.ISSN
      ? {publication: publication.toJSON(), form: form ? form.toJSON() : {}, publisher: publisher ? publisher.toJSON() : {}}
      : {publication: publication.toJSON()};

    const result = convertToMarc({registry, ...opts});
    return formatRecords(result, format);

    /**
     * Format records using serializer chosen based on format given as parameter.
     * @param {Object[]} records Records to serialize
     * @param {string} format Format to serialize to
     * @returns Array of serialized objects
     */
    function formatRecords(records, format) {
      logger.debug(`Formatting ${records.length} MARC records to ${format} format`);
      if (format === 'marc-record-js') {
        return records;
      }

      const serializableRecords = records.map(r => MarcRecordSerializers.Json.from(JSON.stringify(r.toJsonObject())));

      if (format === 'text') {
        return serializableRecords.map(r => MarcRecordSerializers.Text.to(r));
      }

      if (format === 'iso2709') {
        return serializableRecords.map(r => MarcRecordSerializers.ISO2709.to(r)).join('');
      }

      if (format === 'json') {
        return serializableRecords.map(r => MarcRecordSerializers.Json.to(r));
      }

      /* istanbul ignore next */
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, `Unsupported format for transforming MARC record: ${format}`);
    }
  }

  /**
   * Send generated MARC records to Melinda REST API
   * @param {number} id ID of entity to construct MARC record from. Entity type depends of registry type.
   * @returns Array of Melinda API response on success, ApiError on failure
   */
  /* istanbul ignore next */
  async function sendToMelinda(id) {
    if (!melindaApiClient) {
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Cannot send data to Melinda due to error in service configuration. Please contact system administrator.');
    }

    const records = await getRecords(id, 'marc-record-js'); // Note: this returns array of marc-record-js objects

    // Init result
    const result = {errors: 0, records: []};

    // Create records to Melinda
    await Promise.all(records.map(r => createMelindaRecord(r)));

    // Return result
    return result;

    async function createMelindaRecord(record) {
      try {
        const apiResponse = await melindaApiClient.create(record, MELINDA_CREATE_RECORD_PARAMS);
        logger.debug(`Create record operation ended with status ${apiResponse.recordStatus} and databaseId ${apiResponse.databaseId}`);
        result.records = [apiResponse, ...result.records]; // eslint-disable-line functional/immutable-data
      } catch (err) {
        logger.warn(`Creating record to Melinda failed with following error: ${err}`);
        result.errors += 1; // eslint-disable-line functional/immutable-data
      }
    }
  }

  /**
   * Search records from Melinda SRU based on publication identifiers gathered from publications registry
   * @param {number} id ID of entity to search for. Entity type depends of registry type.
   * @returns Array of Melinda record IDs on success, ApiError on failure
   */
  /* istanbul ignore next */
  async function searchFromMelinda(publicationId) {
    if (!melindaSruClient) {
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Cannot search data from Melinda due to error in service configuration');
    }

    const identifiers = await getRecordIdentifiers({registry, publicationId});

    // Process client response
    const results = [];
    await Promise.all(identifiers.identifiers.map(i => process(identifiers.type, i)));

    const recordObjects = await Promise.all(results.map(r => MarcRecordSerializers.MARCXML.from(r)));
    const textRecords = recordObjects.map(r => MarcRecordSerializers.Text.to(r));

    return textRecords;

    async function process(identifierType, identifier) { // eslint-disable-line require-await
      const sruSearchIndex = getSearchIndex(identifierType);

      return new Promise((resolve, reject) => {
        melindaSruClient.searchRetrieve(`${sruSearchIndex}=${identifier}`)
          .on('record', record => {
            results.push(record); // eslint-disable-line functional/immutable-data
          })
          .on('error', reject)
          .on('end', resolve);
      });

      function getSearchIndex(identifierType) {
        if (identifierType === COMMON_IDENTIFIER_TYPES.ISBN) {
          return 'bath.isbn';
        } else if (identifierType === COMMON_IDENTIFIER_TYPES.ISMN) {
          return 'dc.identifier'; // Note: At the time of writing the code, this is the best index for ISMN
        } else if (identifierType === COMMON_IDENTIFIER_TYPES.ISSN) {
          return 'bath.issn';
        }
      }
    }
  }
}


