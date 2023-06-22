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
import {Op, col, literal} from 'sequelize';

import sequelize from '../../models';
import {ApiError} from '../../utils';
import {ISSN_REGISTRY_PUBLICATION_STATUS} from '../constants';

import {formatStatisticsToXlsx} from '../common/utils/statisticsUtils';

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
    const beginDate = new Date(begin);
    const endDate = new Date(end);

    // First part of this statistics consider the current status of ranges
    const ranges = await rangeModel.findAll();
    const firstSheetResult = ranges
      .map(r => r.toJSON())
      .map(r => ({'Lohko': r.block, 'Annettu': r.taken, 'Vapaana': r.free, 'Yht.': r.free + r.taken}));

    // Second part of this statistics consider count of identifiers assigned between the given timeframe
    // grouped by year, month and range block
    const issnCount = await issnUsedModel.findAll({
      attributes: [
        [literal('COUNT(DISTINCT(issnUsed.id))'), 'count'],
        [literal(`SUBSTRING(issnUsed.created, 1, 4)`), 'y'],
        [literal(`SUBSTRING(issnUsed.created, 6, 2)`), 'm']
      ],
      include: [
        {
          association: 'issnRange',
          attributes: ['block']
        }
      ],
      where: {
        created: {
          [Op.between]: [beginDate, endDate]
        }
      },
      group: ['y', 'm', 'issnRange.block'],
      order: ['y', 'm'],
      raw: true
    });

    const secondSheetResult = issnCount
      .map(r => ({
        'Kuukausi': `${r.y} - ${r.m}`,
        'Lohko': r['issnRange.block'],
        'Lukumäärä': r.count
      }));

    return {sheets: [firstSheetResult, secondSheetResult]};
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

    const publishersCreatedCounts = await publisherIssnModel.findAll({
      attributes: [
        [literal('COUNT(DISTINCT(id))', col('id')), 'count'],
        [literal(`SUBSTRING(created, 1, 4)`), 'y'],
        [literal(`SUBSTRING(created, 6, 2)`), 'm']
      ],
      where: {
        created: {
          [Op.between]: [beginDate, endDate]
        }
      },
      group: ['y', 'm']
    });

    const publishersModifiedCounts = await publisherIssnModel.findAll({
      attributes: [
        [literal('COUNT(DISTINCT(id))', col('id')), 'count'],
        [literal(`SUBSTRING(modified, 1, 4)`), 'y'],
        [literal(`SUBSTRING(modified, 6, 2)`), 'm']
      ],
      where: {
        modified: {
          [Op.between]: [beginDate, endDate]
        }
      },
      group: ['y', 'm']
    });

    rows.push(_formatResultSet('Luotu', publishersCreatedCounts, headers)); // eslint-disable-line functional/immutable-data
    rows.push(_formatResultSet('Muokattu', publishersModifiedCounts, headers)); // eslint-disable-line functional/immutable-data

    return rows;

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
    const notProcessedCount = await _getPublicationsByDateAndStatus({beginDate, endDate, status: ISSN_REGISTRY_PUBLICATION_STATUS.NO_PREPUBLICATION_RECORD});
    rows.push(_formatResultSet('Ei ennakkotietoa', notProcessedCount, headers));

    const frozenCount = await _getPublicationsByDateAndStatus({beginDate, endDate, status: ISSN_REGISTRY_PUBLICATION_STATUS.ISSN_FROZEN});
    rows.push(_formatResultSet('Jäädytetty', frozenCount, headers));

    const waitingForControlCopyCount = await _getPublicationsByDateAndStatus({beginDate, endDate, status: ISSN_REGISTRY_PUBLICATION_STATUS.WAITING_FOR_CONTROL_COPY});
    rows.push(_formatResultSet('Odottaa valvontakpl', waitingForControlCopyCount, headers));

    const completedCount = await _getPublicationsByDateAndStatus({beginDate, endDate, status: ISSN_REGISTRY_PUBLICATION_STATUS.COMPLETED});
    rows.push(_formatResultSet('Valmis', completedCount, headers));

    return rows;

    // eslint-disable-next-line require-await
    async function _getPublicationsByDateAndStatus({beginDate, endDate, status}) {
      return publicationIssnModel.findAll({
        attributes: [
          [literal('COUNT(DISTINCT(id))', col('id')), 'count'],
          [literal(`SUBSTRING(created, 1, 4)`), 'y'],
          [literal(`SUBSTRING(created, 6, 2)`), 'm']
        ],
        where: {
          created: {
            [Op.between]: [beginDate, endDate]
          },
          status
        },
        group: ['y', 'm']
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
    // Transform dates
    const beginDate = new Date(begin);
    const endDate = new Date(end);

    // Get form counts and group by year and month
    const formCounts = await issnFormModel.findAll({
      attributes: [
        [literal('COUNT(DISTINCT(id))', col('id')), 'count'],
        [literal(`SUBSTRING(created, 1, 4)`), 'y'],
        [literal(`SUBSTRING(created, 6, 2)`), 'm']
      ],
      where: {
        created: {
          [Op.between]: [beginDate, endDate]
        }
      },
      group: ['y', 'm']
    });

    return formCounts.map(r => r.toJSON()).map(formatResult);

    function formatResult(r) {
      return {
        'Kuukausi': `${r.y}-${r.m}`,
        'Määrä': r.count
      };
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
