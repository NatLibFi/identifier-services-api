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
import {QueryTypes} from 'sequelize';
import {createLogger} from '@natlibfi/melinda-backend-commons';

import sequelize from '../../../models';
import {ApiError} from '../../../utils';
import {COMMON_IDENTIFIER_TYPES, ISBN_REGISTRY_PUBLICATION_TYPES} from '../../constants';

import {AUTHOR_PUBLISHER_ID_ISBN, DB_DIALECT, STATE_PUBLISHER_ID_ISBN, UNIVERSITY_PUBLISHER_ID_ISBN, WEBSITE_USER} from '../../../config';
import {formatPublicationToPIID, formatPublisherToPIID} from './statisticsUtils';
import {formatStatisticsToCsv, formatStatisticsToXlsx, getSQLDateDefinition} from '../../common/utils/statisticsUtils';

/**
 * ISBN statistics interface.
 * @returns Interface to interact with ISBN statistics
 */
export default function () {
  const logger = createLogger();

  const publisherIsbnModel = sequelize.models.publisherIsbn;
  const publicationIsbnModel = sequelize.models.publicationIsbn;
  const messageIsbnModel = sequelize.models.messageIsbn;

  const identifierModel = sequelize.models.identifier;
  const identifierBatchModel = sequelize.models.identifierBatch;

  const STATISTICS = {
    PUBLICATIONS_ISMN: {getter: getAuthorPublisherPublicationStatistics, identifierType: COMMON_IDENTIFIER_TYPES.ISMN}, // "Omakustanteet ISMN"
    PUBLICATIONS_ISBN: {getter: getAuthorPublisherPublicationStatistics, identifierType: COMMON_IDENTIFIER_TYPES.ISBN}, // "Omakustanteet ISBN"
    PUBLISHERS_ISMN: {getter: getPublishersStatistics, identifierType: COMMON_IDENTIFIER_TYPES.ISMN}, // "Kv-rekisteri ISMN"
    PUBLISHERS_ISBN: {getter: getPublishersStatistics, identifierType: COMMON_IDENTIFIER_TYPES.ISBN}, // "Kv-rekisteri ISBN"
    PUBLISHERS_ISMN_UNIQUE: {getter: getPublishersIdentifierUniqueStatistics, identifierType: COMMON_IDENTIFIER_TYPES.ISMN}, // "Kaikki ISMN-kustantajat"
    PUBLISHERS_ISBN_UNIQUE: {getter: getPublishersIdentifierUniqueStatistics, identifierType: COMMON_IDENTIFIER_TYPES.ISBN}, // "Kaikki ISBN-kustantajat"
    PROGRESS_ISMN: {getter: getProgressStatistics, identifierType: COMMON_IDENTIFIER_TYPES.ISMN}, // "ISMN-tunnuskentät"
    PROGRESS_ISBN: {getter: getProgressStatistics, identifierType: COMMON_IDENTIFIER_TYPES.ISBN}, // "ISBN-tunnuskentät"
    MONTHLY: {getter: getMonthlyStatistics, identifierType: null} // "Kuukausitilasto"
  };

  return {
    formatStatistics,
    getStatistics
  };

  /**
   * Format statistics to format defined as parameter
   * @param {string} format Format to format to
   * @param {Object} jsonData Statistics data in JSON format
   * @param {string} type Type of statistics
   * @returns Formatted item
   */
  async function formatStatistics(format, jsonData, type) {
    if (format === 'xlsx') {
      const statisticsType = `ISBN_REGISTRY_${type}`;
      return formatStatisticsToXlsx(statisticsType, jsonData, type);
    }

    if (format === 'csv') {
      return formatStatisticsToCsv(jsonData);
    }

    /* istanbul ignore next */
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Unsupported format for statistics');
  }

  /**
   * Wrapper to retrieve statistics
   * @param {Object} params Parameters for retrieving statistics
   * @returns Object containing required statistics
   */
  async function getStatistics({type, begin, end}) {
    if (Object.keys(STATISTICS).includes(type)) {
      return STATISTICS[type].getter({begin, end, identifierType: STATISTICS[type].identifierType});
    }
    /* istanbul ignore next */
    throw new ApiError(HttpStatus.BAD_REQUEST);
  }

  /**
   * Retrieve publisher identifier statistics of publishers which first publisher identifier was given between the start and end dates
   * @param {Object} params Parameters for retrieving statistics
   * @returns Object containing required statistics
   */
  async function getPublishersIdentifierUniqueStatistics({begin, end, identifierType}) {
    const publisherRangeModel = _getPublisherRangeModel(identifierType);

    // SQL query
    const query = `SELECT * FROM ${publisherIsbnModel.tableName} P ` +
      `INNER JOIN ${publisherRangeModel.tableName} PIR ON P.id = PIR.publisher_id ` +
      'WHERE PIR.id IN ' +
      `  (SELECT min(PIR.id) FROM ${publisherRangeModel.tableName} PIR GROUP BY PIR.publisher_id) ` +
      'AND PIR.created BETWEEN :begin AND :end ' +
      'ORDER BY P.official_name ASC';

    const result = await sequelize.query(query, {
      benchmark: true,
      logging: (sql, timingMs) => logger.debug(`SQL took ${timingMs} ms`),
      replacements: {
        begin,
        end: `${end} 23:59:59`
      },
      type: QueryTypes.SELECT
    });

    // Format result to PIID headers format
    return result.map(publisher => formatPublisherToPIID(publisher, publisher.publisher_identifier, identifierType));
  }

  /**
   * Retrieve publisher statistics of publishers which have had publisher identifier assigned between the selected dates.
   * If multiple identifier have been assigned between the selected time period, publisher is included multiple times to result set:
   * Once for earch publisher identifier.
   * @param {Object} params Parameters for retrieving statistics
   * @returns Object containing required statistics
   */
  async function getPublishersStatistics({begin, end, identifierType}) {
    const publisherRangeModel = _getPublisherRangeModel(identifierType);

    // SQL query
    const query = `SELECT * FROM ${publisherIsbnModel.tableName} P ` +
      `INNER JOIN (SELECT publisher_id, publisher_identifier, created AS pir_created FROM ${publisherRangeModel.tableName} WHERE created BETWEEN :begin AND :end) PIR ` +
      'ON P.id = PIR.publisher_id ' +
      'ORDER BY P.official_name ASC';

    const result = await sequelize.query(query, {
      benchmark: true,
      logging: (sql, timingMs) => logger.debug(`SQL took ${timingMs} ms`),
      replacements: {
        begin,
        end: `${end} 23:59:59`
      },
      type: QueryTypes.SELECT
    });

    const formattedResult = result.map(publisher => formatPublisherToPIID(publisher, publisher.publisher_identifier, identifierType));

    // Result set requires also an entry per each of the previous names with status code 'I'
    // Publisher identifier should be the latest available for the publisher
    const previousNameEntries = result
      .reduce(_getPreviousNameEntries, [])
      .map(previousNameEntry => formatPublisherToPIID(previousNameEntry, previousNameEntry.publisher_identifier, identifierType, true))
      .flat();

    return [formattedResult, previousNameEntries]
      .flat()
      .sort((x, y) => x.Registrant_Name.toLowerCase().localeCompare(y.Registrant_Name.toLowerCase()));


    function _getPreviousNameEntries(prev, cur) {
      // If publisher does not have previous names, do not include to this result set
      if (!_hasPreviousNames(cur)) {
        return prev;
      }

      // If publisher had previous name, but was not yet in result set, include it
      const existingEntryIdx = prev.findIndex(publisher => publisher.id === cur.id);
      if (existingEntryIdx === -1) {
        return [...prev, cur];
      }

      // If publisher entry exists in result set, but does not consider the latest publisher range
      // Change the entry in result set so that latest publisher range entry is included to result set
      const prevCreatedDate = new Date(prev[existingEntryIdx].pir_created);
      const curCreatedDate = new Date(cur.pir_created);

      if (prevCreatedDate < curCreatedDate) {
        prev[existingEntryIdx] = cur;
        return prev;
      }

      // If publisher range result set already had the latest created publisher range, return set as it was
      return prev;
    }

    function _hasPreviousNames(publisher) {
      const previousNames = publisher.previous_names;
      return previousNames && typeof previousNames === 'string' && previousNames.length > 0;
    }
  }

  /**
   * Retrieve author publisher statistics of publishers which have been either created or modified between the selected dates
   * @param {Object} params Parameters for retrieving statistics
   * @returns Object containing required statistics
   */
  async function getAuthorPublisherPublicationStatistics({begin, end, identifierType}) {
    // SQL query
    const query = `SELECT * FROM ${publicationIsbnModel.tableName} ` +
      `WHERE publisher_id = :publisherId AND ` +
      'publication_identifier_type = :identifierType AND ' +
      '((created BETWEEN :begin AND :end) OR (modified BETWEEN :begin AND :end)) ' +
      'ORDER BY official_name ASC';

    const result = await sequelize.query(query, {
      benchmark: true,
      logging: (sql, timingMs) => logger.debug(`SQL took ${timingMs} ms`),
      replacements: {
        identifierType,
        publisherId: AUTHOR_PUBLISHER_ID_ISBN,
        begin,
        end: `${end} 23:59:59`
      },
      type: QueryTypes.SELECT
    });

    return result
      .map(publication => _generateEntries(publication, identifierType))
      .flat();

    /**
     * Generates formatted entries from data given as parameter
     * @param {Object[]} p Publications to format
     * @returns Array of objects which are formatted to have properties similar to PIID headers
     */
    function _generateEntries(p, identifierType) {
      const publicationIdentifierPrint = p.publication_identifier_print;
      const publicationIdentifierElectronical = p.publication_identifier_electronical;

      const publicationIdentifierPrintPublications = publicationIdentifierPrint ? _getFormattedPublicationInfo(p, publicationIdentifierPrint, identifierType) : [];
      const publicationIdentifierElectronicalPublications = publicationIdentifierElectronical ? _getFormattedPublicationInfo(p, publicationIdentifierElectronical, identifierType) : [];

      return [...publicationIdentifierPrintPublications, ...publicationIdentifierElectronicalPublications].flat();

      function _getFormattedPublicationInfo(publication, identifiers, identifierType) {
        return Object.entries(JSON.parse(identifiers)).map(([identifier, publicationFormat]) => formatPublicationToPIID(publication, identifier, publicationFormat, identifierType));
      }
    }
  }

  /**
   * Retrieve statistics of progress regarding range blocks
   * @param {Object} params Parameters for retrieving statistics
   * @returns Object containing required statistics
   */
  async function getProgressStatistics({identifierType}) {
    const model = _getRangeModel(identifierType);
    const ranges = await model.findAll();

    return ranges.map(r => r.toJSON()).map(r => formatRange(r, identifierType));

    function formatRange(range, identifierType) {
      const {prefix, langGroup, rangeBegin, rangeEnd, free, taken, canceled} = range;

      if (identifierType === COMMON_IDENTIFIER_TYPES.ISBN) {
        return {
          etuliite: String(prefix),
          kieliryhmä: String(langGroup),
          alku: String(rangeBegin),
          loppu: String(rangeEnd),
          vapaana: free + canceled,
          'käytetty': taken - canceled
        };
      }

      if (identifierType === COMMON_IDENTIFIER_TYPES.ISMN) {
        return {
          etuliite: String(prefix),
          alku: String(rangeBegin),
          loppu: String(rangeEnd),
          vapaana: free + canceled,
          'käytetty': taken - canceled
        };
      }

      return {};
    }
  }

  // Does not yet have automated tests
  async function getMonthlyStatistics({begin, end}) {
    // Init result set
    // Transform dates and get array of year/months
    const beginDate = new Date(begin);
    const endDate = new Date(end);

    const dateColumns = _getMonthlyStatColumns(beginDate, endDate);
    const headers = ['Tilaston tyyppi', ...dateColumns];
    const rows = [];

    // Header columns are following
    // Stat name column
    // 1 column per month in format of `${month} / ${year}`

    // Following publisherIds are excluded from statistics for category 1 subranges
    const excludePublisherIdsCat1 = [AUTHOR_PUBLISHER_ID_ISBN, STATE_PUBLISHER_ID_ISBN, UNIVERSITY_PUBLISHER_ID_ISBN];

    // Get sent messages count
    const messageCounts = await _getByMessageCount({begin, end});
    rows.push(_formatResultSet('Lähetetyt viestit', messageCounts, headers));

    // Get new ISBN publisher count and push formatted version to rows
    // Note: only tests creation date of publisher request, not creation date of subrange (similar to previous)
    const publisherIsbnCreatedCount = await _getCreatedPublisherCount({begin, end, identifierType: COMMON_IDENTIFIER_TYPES.ISBN});
    rows.push(_formatResultSet('Uudet kustantajat (ISBN)', publisherIsbnCreatedCount, headers));

    // Get ISMN publisher count
    const publisherIsmnCreatedCount = await _getCreatedPublisherCount({begin, end, identifierType: COMMON_IDENTIFIER_TYPES.ISMN});
    rows.push(_formatResultSet('Uudet kustantajat (ISMN)', publisherIsmnCreatedCount, headers));

    // Get count of publisher requests that have come through WEB interface using default WEB user
    const publisherRegistrationCount = await _getCreatedPublisherRequests({begin, end});
    rows.push(_formatResultSet('Kustantajarekisterin liittymislomakkeet', publisherRegistrationCount, headers));

    // Get new ISBN application count
    const publicationRegistrationIsbnCount = await _getCreatedPublicationRequests({begin, end, music: false});
    rows.push(_formatResultSet('ISBN hakulomakkeet', publicationRegistrationIsbnCount, headers));

    // Get new ISMN application count
    const publicationRegistrationIsmnCount = await _getCreatedPublicationRequests({begin, end, music: true});
    rows.push(_formatResultSet('ISMN hakulomakkeet', publicationRegistrationIsmnCount, headers));

    // ISBN identifier stats

    // Get created ISBN identifier count for authorpublisher
    const createdIsbnCountAuthor = await _getCreatedIdentifierCount({begin, end, identifierType: COMMON_IDENTIFIER_TYPES.ISBN, publisherId: AUTHOR_PUBLISHER_ID_ISBN});
    rows.push(_formatResultSet('Myönnetyt ISBN-tunnukset (omakustanteet)', createdIsbnCountAuthor, headers));

    // Get created ISBN identifier count for state publisher
    const createdIsbnCountState = await _getCreatedIdentifierCount({begin, end, identifierType: COMMON_IDENTIFIER_TYPES.ISBN, publisherId: STATE_PUBLISHER_ID_ISBN});
    rows.push(_formatResultSet('Myönnetyt ISBN-tunnukset (valtio)', createdIsbnCountState, headers));

    // Get created ISBN identifier count for university publisher
    const createdIsbnCountUniversity = await _getCreatedIdentifierCount({begin, end, identifierType: COMMON_IDENTIFIER_TYPES.ISBN, publisherId: UNIVERSITY_PUBLISHER_ID_ISBN});
    rows.push(_formatResultSet('Myönnetyt ISBN-tunnukset (yliopisto)', createdIsbnCountUniversity, headers));

    // Get created ISBN identifier count regarding category 1 subranges
    const createdIsbnCountCat1 = await _getCreatedIdentifierCount({begin, end, identifierType: COMMON_IDENTIFIER_TYPES.ISBN, excludePublisherIds: excludePublisherIdsCat1, category: 1});
    rows.push(_formatResultSet('Myönnetyt ISBN-tunnukset (5-merkkiset)', createdIsbnCountCat1, headers));

    // ISMN identifier stats

    // Get created ISMN identifier count for authorpublisher
    const createdIsmnCountAuthor = await _getCreatedIdentifierCount({begin, end, identifierType: COMMON_IDENTIFIER_TYPES.ISMN, publisherId: AUTHOR_PUBLISHER_ID_ISBN});
    rows.push(_formatResultSet('Myönnetyt ISMN-tunnukset (omakustanteet)', createdIsmnCountAuthor, headers));

    // Get created ISMN identifier count regarding category 1 subranges
    const createdIsmnCountCat1 = await _getCreatedIdentifierCount({begin, end, identifierType: COMMON_IDENTIFIER_TYPES.ISMN, excludePublisherIds: excludePublisherIdsCat1, category: 1});
    rows.push(_formatResultSet('Myönnetyt ISMN-tunnukset (7-merkkiset)', createdIsmnCountCat1, headers));

    // Get modified publisher count
    const modifiedPublisherCount = await _getModifiedPublisherCount({begin, end});
    rows.push(_formatResultSet('Kustantajatietojen muokkaukset', modifiedPublisherCount, headers));

    // Return results
    return rows;

    function _formatResultSet(name, resultSet, headers) {
      // Generate result object from column information
      const result = headers.reduce((prev, k) => ({...prev, [k]: ''}), {});

      // Transform result set
      const transformedResult = resultSet
        .map(({y, m, c}) => ({[`${Number(m)} / ${y}`]: `${c}`})); // Transform keys to match dateColumn keys

      // Looping through array object keys to assign them to result
      transformedResult.forEach(v => {
        Object.keys(v).forEach(k => {
          result[k] = v[k];
        });
      });

      // Fill zeroes as if no entries exist, this is formatted as zero
      Object.keys(result).forEach(k => {
        if (result[k] === '') {
          result[k] = '0';
        }
      });

      // Add name information to row
      result['Tilaston tyyppi'] = name;

      return result;
    }
  }


  // Returns array of strings representing months between beginDate and endDate in format of
  // `${month} / ${year}`
  function _getMonthlyStatColumns(beginDate, endDate) {
    const startMonth = beginDate.getMonth() + 1;
    const startYear = beginDate.getFullYear();

    const endMonth = endDate.getMonth() + 1;
    const endYear = endDate.getFullYear();

    const results = [];

    const years = [...Array(endYear - startYear + 1).keys()].map(v => v + startYear);

    // Loop through years and months, add headers in date range to result
    years.forEach(year => {
      [...Array(12).keys()].map(v => v + 1).forEach(month => {
        if (year === startYear && month < startMonth) {
          return;
        }

        if (year === endYear && month > endMonth) {
          return;
        }

        results.push(`${month} / ${year}`);
        return;
      });
    });

    return results;
  }

  /**
   * Get Sequelize model for selected identifier type publisher range
   * @param {string} identifierType Type of identifiers to get publisher range model for
   * @returns Sequelize model for selected identifier type's publisher ranges
   */
  function _getPublisherRangeModel(identifierType) {
    if (identifierType === COMMON_IDENTIFIER_TYPES.ISBN) {
      return sequelize.models.isbnSubRange;
    }

    if (identifierType === COMMON_IDENTIFIER_TYPES.ISMN) {
      return sequelize.models.ismnSubRange;
    }

    throw new Error(`Cannot find publisher range model for identifier type of ${identifierType}`);
  }

  /**
   * Get association models for selected identifier type
   * @param {string} identifierType Type of identifiers to get association models for
   * @returns Object containing range association model
   */
  function _getRangeModel(identifierType) {
    if (identifierType === COMMON_IDENTIFIER_TYPES.ISBN) {
      return sequelize.models.isbnRange;
    }

    if (identifierType === COMMON_IDENTIFIER_TYPES.ISMN) {
      return sequelize.models.ismnRange;
    }

    return undefined;
  }

  // MONTHLY STATS GETTER FUNCTIONS
  // These contain SQL queries for retrieving statistics
  async function _getByMessageCount({begin, end}) {
    const yearDefinition = getSQLDateDefinition(DB_DIALECT, 'year', 'sent');
    const monthDefinition = getSQLDateDefinition(DB_DIALECT, 'month', 'sent');

    const query = `SELECT ${yearDefinition} as y, ${monthDefinition} AS m, COUNT(DISTINCT id) as c FROM ${messageIsbnModel.tableName} WHERE ` +
      `sent BETWEEN :begin AND :end ` +
      `GROUP BY ${yearDefinition}, ${monthDefinition}`;

    return sequelize.query(query, {
      benchmark: true,
      logging: (sql, timingMs) => logger.debug(`SQL took ${timingMs} ms`),
      replacements: {
        publisherId: AUTHOR_PUBLISHER_ID_ISBN,
        begin,
        end: `${end} 23:59:59`
      },
      type: QueryTypes.SELECT
    });
  }

  async function _getCreatedPublisherCount({begin, end, identifierType}) {
    const publisherRangeModel = _getPublisherRangeModel(identifierType);

    const yearDefinition = getSQLDateDefinition(DB_DIALECT, 'year', 'P.created');
    const monthDefinition = getSQLDateDefinition(DB_DIALECT, 'month', 'P.created');

    const query = `SELECT ${yearDefinition} as y, ${monthDefinition} AS m, COUNT(DISTINCT P.id) as c FROM ${publisherIsbnModel.tableName} P ` +
      `INNER JOIN ${publisherRangeModel.tableName} PIR ON P.id = PIR.publisher_id ` +
      `WHERE P.created BETWEEN :begin AND :end ` +
      `GROUP BY ${yearDefinition}, ${monthDefinition}`;

    return sequelize.query(query, {
      benchmark: true,
      logging: (sql, timingMs) => logger.debug(`SQL took ${timingMs} ms`),
      replacements: {
        begin,
        end: `${end} 23:59:59`
      },
      type: QueryTypes.SELECT
    });
  }

  async function _getCreatedPublisherRequests({begin, end}) {
    const yearDefinition = getSQLDateDefinition(DB_DIALECT, 'year', 'created');
    const monthDefinition = getSQLDateDefinition(DB_DIALECT, 'month', 'created');

    const query = `SELECT ${yearDefinition} as y, ${monthDefinition} AS m, COUNT(DISTINCT id) as c FROM ${publisherIsbnModel.tableName} ` +
      `WHERE created BETWEEN :begin AND :end AND created_by = :websiteUser ` +
      `GROUP BY ${yearDefinition}, ${monthDefinition}`;

    return sequelize.query(query, {
      benchmark: true,
      logging: (sql, timingMs) => logger.debug(`SQL took ${timingMs} ms`),
      replacements: {
        websiteUser: WEBSITE_USER,
        begin,
        end: `${end} 23:59:59`
      },
      type: QueryTypes.SELECT
    });
  }

  async function _getCreatedPublicationRequests({begin, end, music}) {
    const yearDefinition = getSQLDateDefinition(DB_DIALECT, 'year', 'created');
    const monthDefinition = getSQLDateDefinition(DB_DIALECT, 'month', 'created');

    const query = `SELECT ${yearDefinition} as y, ${monthDefinition} AS m, COUNT(DISTINCT id) as c FROM ${publicationIsbnModel.tableName} ` +
      `WHERE created BETWEEN :begin AND :end AND created_by = :websiteUser ` +
      `${_getSheetMusicCondition(music)}` +
      `GROUP BY ${yearDefinition}, ${monthDefinition}`;

    return sequelize.query(query, {
      benchmark: true,
      logging: (sql, timingMs) => logger.debug(`SQL took ${timingMs} ms`),
      replacements: {
        websiteUser: WEBSITE_USER,
        begin,
        end: `${end} 23:59:59`
      },
      type: QueryTypes.SELECT
    });

    function _getSheetMusicCondition(music) {
      return music ? `AND publication_type = "${ISBN_REGISTRY_PUBLICATION_TYPES.SHEET_MUSIC}" ` : `AND publication_type != "${ISBN_REGISTRY_PUBLICATION_TYPES.SHEET_MUSIC}" `;
    }
  }

  async function _getCreatedIdentifierCount({begin, end, identifierType, publisherId, excludePublisherIds, category}) {
    const yearDefinition = getSQLDateDefinition(DB_DIALECT, 'year', 'IB.created');
    const monthDefinition = getSQLDateDefinition(DB_DIALECT, 'month', 'IB.created');

    const publisherRangeModel = _getPublisherRangeModel(identifierType);
    const conditions = [_getPublisherConditions(publisherId, excludePublisherIds), _getCategoryConditions(category)].filter(condition => condition !== '');

    const query = `SELECT ${yearDefinition} as y, ${monthDefinition} AS m, COUNT(DISTINCT I.id) as c FROM ${publisherRangeModel.tableName} PIR ` +
      `INNER JOIN ${identifierModel.tableName} I ON I.publisher_identifier_range_id = PIR.id ` +
      `INNER JOIN ${identifierBatchModel.tableName} IB ON I.identifier_batch_id = IB.id ` +
      `WHERE IB.identifier_type = :identifierType AND IB.created BETWEEN :begin AND :end ` +
      `${_getConditionString(conditions)}` +
      `GROUP BY ${yearDefinition}, ${monthDefinition}`;

    return sequelize.query(query, {
      benchmark: true,
      logging: (sql, timingMs) => logger.debug(`SQL took ${timingMs} ms`),
      replacements: {
        begin,
        end: `${end} 23:59:59`,
        identifierType
      },
      type: QueryTypes.SELECT
    });

    function _getPublisherConditions(publisherId, excludePublisherIds) {
      if (publisherId) {
        return `PIR.publisher_id = ${publisherId}`;
      }

      if (excludePublisherIds) {
        return `PIR.publisher_id NOT IN (${excludePublisherIds.join(',')})`;
      }

      return '';
    }

    function _getCategoryConditions(category) {
      if (category) {
        return `PIR.category = ${category}`;
      }

      return '';
    }

    function _getConditionString(conditions) {
      if (conditions.length === 0) {
        return '';
      }

      return `AND ${conditions.join(' AND ')} `;
    }
  }

  async function _getModifiedPublisherCount({begin, end}) {
    const yearDefinition = getSQLDateDefinition(DB_DIALECT, 'year', 'modified');
    const monthDefinition = getSQLDateDefinition(DB_DIALECT, 'month', 'modified');

    const query = `SELECT ${yearDefinition} as y, ${monthDefinition} AS m, COUNT(DISTINCT id) as c FROM ${publisherIsbnModel.tableName} ` +
      `WHERE modified BETWEEN :begin AND :end ` +
      `GROUP BY ${yearDefinition}, ${monthDefinition}`;

    return sequelize.query(query, {
      benchmark: true,
      logging: (sql, timingMs) => logger.debug(`SQL took ${timingMs} ms`),
      replacements: {
        begin,
        end: `${end} 23:59:59`
      },
      type: QueryTypes.SELECT
    });
  }
}
