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

import sequelize from '../../models';
import {ApiError} from '../../utils';
import {ISSN_REGISTRY_PUBLICATION_STATUS} from '../constants';

import {formatStatisticsToXlsx, getSQLDateDefinition} from '../common/utils/statisticsUtils';
import {DB_DIALECT} from '../../config';

/**
 * ISSN-registry statistics interface.
 * @returns Interface to interact with ISSN statistics
 */
/* eslint-disable max-lines */
export default function () {
  const rangeModel = sequelize.models.issnRange;
  const issnUsedModel = sequelize.models.issnUsed;
  const publisherIssnModel = sequelize.models.publisherIssn;
  const publicationIssnModel = sequelize.models.publicationIssn;
  const issnFormModel = sequelize.models.issnForm;

  const STATISTICS = {
    ISSN: {getter: getIssnStatistics}, // "ISSN"
    PUBLISHERS: {getter: getIssnPublisherStatistics}, // "Julkaisijat"
    PUBLICATIONS: {getter: getIssnPublicationStatistics}, // "Julkaisut"
    FORMS: {getter: getIssnFormStatistics} // "Pyynnöt"
  };

  return {
    formatStatistics,
    getStatistics
  };

  /**
   * Format statistics to format defined as parameter
   * @param {string} format Format to format to
   * @param {Object} jsonData Statistics item in JSON format
   * @param {string} type Type of statistics
   * @returns Formatted item
   */
  async function formatStatistics(format, jsonData, type) { // eslint-disable-line require-await
    if (format === 'xlsx') {
      const statisticsType = `ISSN_REGISTRY_${type}`;
      return formatStatisticsToXlsx(statisticsType, jsonData, type);
    }

    throw new ApiError(HttpStatus.BAD_REQUEST, 'Unsupported format for statistics');
  }

  /**
   * Wrapper to retrieve statistics
   * @param {Object} params Parameters for retrieving statistics
   * @returns Object containing required statistics
   */
  async function getStatistics({type, begin, end}) { // eslint-disable-line require-await
    if (Object.keys(STATISTICS).includes(type)) {
      return STATISTICS[type].getter({begin, end});
    }
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Statistics type is not supported');
  }

  /**
   * Retrieve statistics regarding ISSN range block progression
   * @param {Object} dateParams Begin and end parameters
   * @returns Object containing sheets-attribute
   */
  async function getIssnStatistics({begin, end}) {
    // First part of this statistics consider the current status of ranges
    const ranges = await rangeModel.findAll({attributes: ['block', 'taken', 'free']});
    const firstSheetResult = ranges.map(r => ({'Lohko': r.block, 'Annettu': r.taken, 'Vapaana': r.free, 'Yht.': r.free + r.taken}));

    // Second part of this statistics consider count of identifiers assigned between the given timeframe
    // grouped by year, month and range block
    const secondSheetResult = await _getRangeMonthlyStatistics({begin, end});
    const formattedSecondSheetResult = secondSheetResult
      .map(r => ({
        'Kuukausi': `${r.y} - ${r.m}`,
        'Lohko': r.block,
        'Lukumäärä': r.c
      }));

    return {sheets: [firstSheetResult, formattedSecondSheetResult]};

    // eslint-disable-next-line require-await
    async function _getRangeMonthlyStatistics({begin, end}) {
      const yearDefinition = getSQLDateDefinition(DB_DIALECT, 'year', 'IU.created');
      const monthDefinition = getSQLDateDefinition(DB_DIALECT, 'month', 'IU.created');

      const query = `SELECT ${yearDefinition} as y, ${monthDefinition} AS m, IR.block AS block, COUNT(DISTINCT IU.id) as c FROM :issnRangeTableName IR ` +
                    `INNER JOIN :identifierUsedTableName IU ON IU.issn_range_id = IR.id ` +
                    `WHERE IU.created BETWEEN :begin AND :end ` +
                    `GROUP BY ${yearDefinition}, ${monthDefinition}, IR.block ` +
                    `ORDER BY ${yearDefinition}, ${monthDefinition}, IR.block`;

      return sequelize.query(query, {
        replacements: {
          issnRangeTableName: rangeModel.tableName,
          identifierUsedTableName: issnUsedModel.tableName,
          begin,
          end: `${end} 23:59:59`
        },
        type: QueryTypes.SELECT
      });
    }
  }

  /**
   * Retrieve statistics regarding ISSN publishers
   * @param {Object} dateParams Begin and end parameters
   * @returns Array containing containing results
   */
  async function getIssnPublisherStatistics({begin, end}) {
    const beginDate = new Date(begin);
    const endDate = new Date(end);

    const dateColumns = _getMonthlyStatColumns(beginDate, endDate);
    const headers = ['Aktiviteetin tyyppi', ...dateColumns];
    const rows = [];

    const publishersCreatedCounts = await _getCreatedPublisherCount({begin, end});
    rows.push(_formatResultSet('Luotu', publishersCreatedCounts, headers)); // eslint-disable-line functional/immutable-data

    const publishersModifiedCounts = await _getModifiedPublisherCount({begin, end});
    rows.push(_formatResultSet('Muokattu', publishersModifiedCounts, headers)); // eslint-disable-line functional/immutable-data

    return rows;

    // eslint-disable-next-line require-await
    async function _getCreatedPublisherCount({begin, end}) {
      const yearDefinition = getSQLDateDefinition(DB_DIALECT, 'year', 'created');
      const monthDefinition = getSQLDateDefinition(DB_DIALECT, 'month', 'created');

      const query = `SELECT ${yearDefinition} as y, ${monthDefinition} AS m, COUNT(DISTINCT id) as c FROM :publisherTableName ` +
                    `WHERE created BETWEEN :begin AND :end ` +
                    `GROUP BY ${yearDefinition}, ${monthDefinition}`;

      return sequelize.query(query, {
        replacements: {
          publisherTableName: publisherIssnModel.tableName,
          begin,
          end: `${end} 23:59:59`
        },
        type: QueryTypes.SELECT
      });
    }

    // eslint-disable-next-line require-await
    async function _getModifiedPublisherCount({begin, end}) {
      const yearDefinition = getSQLDateDefinition(DB_DIALECT, 'year', 'modified');
      const monthDefinition = getSQLDateDefinition(DB_DIALECT, 'month', 'modified');

      const query = `SELECT ${yearDefinition} as y, ${monthDefinition} AS m, COUNT(DISTINCT id) as c FROM :publisherTableName ` +
                    `WHERE modified BETWEEN :begin AND :end ` +
                    `GROUP BY ${yearDefinition}, ${monthDefinition}`;

      return sequelize.query(query, {
        replacements: {
          publisherTableName: publisherIssnModel.tableName,
          begin,
          end: `${end} 23:59:59`
        },
        type: QueryTypes.SELECT
      });
    }

    function _formatResultSet(state, resultSet, headers) {
      // Generate result object from column information
      const result = headers.reduce((prev, k) => ({...prev, [k]: ''}), {});

      // Transform result set
      const transformedResult = resultSet
        .map(v => v.toJSON()) // Transform to JSONified format
        .map(({y, m, c}) => ({[`${y}-${Number(m)}`]: `${c}`})); // Transform keys to match dateColumn keys

      // Looping through array object keys to assign them to result
      transformedResult.forEach(v => {
        Object.keys(v).forEach(k => {
          result[k] = v[k]; // eslint-disable-line functional/immutable-data
        });
      });

      // Fill zeroes
      Object.keys(result).forEach(k => {
        /* eslint-disable functional/no-conditional-statements */
        if (result[k] === '') {
          result[k] = '0'; // eslint-disable-line functional/immutable-data
        }
      });

      // Add state information to row
      result['Aktiviteetin tyyppi'] = state; // eslint-disable-line functional/immutable-data

      return result;
    }
  }

  /**
   * Retrieve statistics regarding ISSN publications
   * @param {Object} dateParams Begin and end parameters
   * @returns Array containing results
   */
  /* eslint-disable functional/immutable-data */
  async function getIssnPublicationStatistics({begin, end}) {
    // Transform dates and get array of year/months
    const beginDate = new Date(begin);
    const endDate = new Date(end);

    // Get required headers
    const dateColumns = _getMonthlyStatColumns(beginDate, endDate);
    const headers = ['Julkaisun tila', ...dateColumns];
    const rows = [];

    // Get data and format it to fit the headers
    const notProcessedCount = await _getPublicationsByDateAndStatus({begin, end, status: ISSN_REGISTRY_PUBLICATION_STATUS.NO_PREPUBLICATION_RECORD});
    rows.push(_formatResultSet('Ei ennakkotietoa', notProcessedCount, headers));

    const frozenCount = await _getPublicationsByDateAndStatus({begin, end, status: ISSN_REGISTRY_PUBLICATION_STATUS.ISSN_FROZEN});
    rows.push(_formatResultSet('Jäädytetty', frozenCount, headers));

    const waitingForControlCopyCount = await _getPublicationsByDateAndStatus({begin, end, status: ISSN_REGISTRY_PUBLICATION_STATUS.WAITING_FOR_CONTROL_COPY});
    rows.push(_formatResultSet('Odottaa valvontakpl', waitingForControlCopyCount, headers));

    const completedCount = await _getPublicationsByDateAndStatus({begin, end, status: ISSN_REGISTRY_PUBLICATION_STATUS.COMPLETED});
    rows.push(_formatResultSet('Valmis', completedCount, headers));

    return rows;

    // eslint-disable-next-line require-await
    async function _getPublicationsByDateAndStatus({begin, end, status}) {
      const yearDefinition = getSQLDateDefinition(DB_DIALECT, 'year', 'created');
      const monthDefinition = getSQLDateDefinition(DB_DIALECT, 'month', 'created');

      const query = `SELECT ${yearDefinition} as y, ${monthDefinition} AS m, COUNT(DISTINCT id) as c FROM :publicationTableName ` +
                    `WHERE created BETWEEN :begin AND :end AND status = :status ` +
                    `GROUP BY ${yearDefinition}, ${monthDefinition}`;

      return sequelize.query(query, {
        replacements: {
          publicationTableName: publicationIssnModel.tableName,
          status,
          begin,
          end: `${end} 23:59:59`
        },
        type: QueryTypes.SELECT
      });
    }

    function _formatResultSet(state, resultSet, headers) {
      // Generate result object from column information
      const result = headers.reduce((prev, k) => ({...prev, [k]: ''}), {});

      // Transform result set
      const transformedResult = resultSet
        .map(v => v.toJSON()) // Transform to JSONified format
        .map(({y, m, count}) => ({[`${y}-${Number(m)}`]: `${count}`})); // Transform keys to match dateColumn keys

      // Looping through array object keys to assign them to result
      transformedResult.forEach(v => {
        Object.keys(v).forEach(k => {
          result[k] = v[k]; // eslint-disable-line functional/immutable-data
        });
      });

      // Fill zeroes
      Object.keys(result).forEach(k => {
        /* eslint-disable functional/no-conditional-statements */
        if (result[k] === '') {
          result[k] = '0';
        }
      });

      // Add state information to row
      result['Julkaisun tila'] = state;

      return result;
    }
  }
  /* eslint-enable functional/immutable-data */

  /**
   * Retrieve statistics regarding ISSN forms
   * @param {Object} dateParams Begin and end parameters
   * @returns Array containing results
   */
  async function getIssnFormStatistics({begin, end}) {
    // Get form counts and group by year and month
    const formCounts = await _getCreatedForms({begin, end});

    return formCounts.map(formatResult);

    function formatResult(r) {
      return {'Kuukausi': `${r.y}-${r.m}`, 'Määrä': r.c};
    }

    // eslint-disable-next-line require-await
    async function _getCreatedForms({begin, end}) {
      const yearDefinition = getSQLDateDefinition(DB_DIALECT, 'year', 'created');
      const monthDefinition = getSQLDateDefinition(DB_DIALECT, 'month', 'created');

      const query = `SELECT ${yearDefinition} as y, ${monthDefinition} AS m, COUNT(DISTINCT id) as c FROM :issnFormTableName ` +
                    `WHERE created BETWEEN :begin AND :end ` +
                    `GROUP BY ${yearDefinition}, ${monthDefinition}`;

      return sequelize.query(query, {
        replacements: {
          issnFormTableName: issnFormModel.tableName,
          begin,
          end: `${end} 23:59:59`
        },
        type: QueryTypes.SELECT
      });
    }
  }

  // Returns array of strings representing months between beginDate and endDate in format of
  // `${year}-${month}`
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

        results.push(`${year}-${month}`); // eslint-disable-line functional/immutable-data
        return;
      });
    });

    return results;
  }
}
