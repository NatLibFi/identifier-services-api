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
import {Op, fn, col, literal} from 'sequelize';
import {createLogger} from '@natlibfi/melinda-backend-commons';

import sequelize from '../../../models';
import {ApiError} from '../../../utils';
import {COMMON_IDENTIFIER_TYPES, ISBN_REGISTRY_PUBLICATION_TYPES} from '../../constants';

import {AUTHOR_PUBLISHER_ID_ISBN, STATE_PUBLISHER_ID_ISBN, UNIVERSITY_PUBLISHER_ID_ISBN, WEBSITE_USER} from '../../../config';
import {formatPublicationToPIID, formatPublisherToPIID} from './statisticsUtils';
import {formatStatisticsToXlsx} from '../../common/utils/statisticsUtils';

/**
 * ISBN statistics interface.
 * @returns Interface to interact with ISBN statistics
 */
/* eslint-disable max-lines */
export default function () {
  const logger = createLogger(); // eslint-disable-line

  const publisherIsbnModel = sequelize.models.publisherIsbn;
  const publicationIsbnModel = sequelize.models.publicationIsbn;
  const messageIsbnModel = sequelize.models.messageIsbn;

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
  async function formatStatistics(format, jsonData, type) { // eslint-disable-line require-await
    if (format === 'xlsx') {
      const statisticsType = `ISBN_REGISTRY_${type}`;
      return formatStatisticsToXlsx(statisticsType, jsonData, type);
    }
    /* istanbul ignore next */
    throw new ApiError(HttpStatus.BAD_REQUEST, 'Unsupported format for statistics');
  }

  /**
   * Wrapper to retrieve statistics
   * @param {Object} params Parameters for retrieving statistics
   * @returns Object containing required statistics
   */
  async function getStatistics({type, begin, end}) { // eslint-disable-line require-await
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
    // Set models depending on identifier type
    const ASSOCIATIONS = _getAssociations(identifierType);

    const publishers = await publisherIsbnModel.findAll({
      include: [
        {
          association: ASSOCIATIONS.subRange,
          attributes: ['id', 'publisherIdentifier', 'created']
        }
      ],
      order: [['officialName', 'ASC']]
    });

    const result = publishers
      .map(publisher => publisher.toJSON())
      .filter(publisher => publisher[ASSOCIATIONS.subRange].length > 0)
      .map(publisher => ({...publisher, subrange: publisher[ASSOCIATIONS.subRange].reduce((prev, curr) => prev.id < curr.id ? prev : curr)})) // Reduce to only first given identifier
      .filter(publisher => _createdBetween(publisher.subrange, begin, end)) // Select only publishers whose first identifier was created in given time period range
      .map(publisher => formatPublisherToPIID(publisher, publisher.subrange.publisherIdentifier, identifierType)); // Format to PIID headers

    return result;
  }

  /**
   * Retrieve publisher statistics of publishers which have had publisher identifier assigned between the selected dates
   * @param {Object} params Parameters for retrieving statistics
   * @returns Object containing required statistics
   */
  async function getPublishersStatistics({begin, end, identifierType}) {
    // Set models depending on identifier type
    const ASSOCIATIONS = _getAssociations(identifierType);

    const publishers = await publisherIsbnModel.findAll({
      include: [
        {
          association: ASSOCIATIONS.subRange,
          attributes: ['publisherIdentifier', 'created']
        }
      ],
      order: [['officialName', 'ASC']]
    });

    const result = publishers
      .map(publisher => publisher.toJSON())
      .map(publisher => ({...publisher, [ASSOCIATIONS.subRange]: publisher[ASSOCIATIONS.subRange].filter(sr => _createdBetween(sr, begin, end))})) // Remove subranges which have been created outside desired range
      .filter(publisher => publisher[ASSOCIATIONS.subRange].length > 0) // Consider only publishers having requested type of subranges in requested range
      .map(publisher => _generateEntries(publisher, ASSOCIATIONS)) // Format to PIID headers
      .flat();

    return [...result].sort((x, y) => x.Registrant_Name.toLowerCase().localeCompare(y.Registrant_Name.toLowerCase())); // Return in alphabetical order

    function _generateEntries(publisher, associations) {
      // These are the entries for each publisher range of publisher
      const publisherEntries = publisher[associations.subRange].map(sr => formatPublisherToPIID(publisher, sr.publisherIdentifier, identifierType));

      // For each of the previous names, an entry with status code 'I' is constructed
      // All same contact information is used as with official name entry. The prefix/isbn/ismn identifier is the latest available of publisher subranges.
      const previousNameEntries = formatPublisherToPIID(publisher, publisher[associations.subRange].slice(-1)[0].publisherIdentifier, identifierType, true);

      return [
        ...publisherEntries,
        ...previousNameEntries
      ];
    }
  }

  /**
   * Retrieve author publisher statistics of publishers which have been either created or modified between the selected dates
   * @param {Object} params Parameters for retrieving statistics
   * @returns Object containing required statistics
   */
  async function getAuthorPublisherPublicationStatistics({begin, end, identifierType}) {
    const authorPublisherPublications = await publicationIsbnModel.findAll({
      where: {
        publisherId: AUTHOR_PUBLISHER_ID_ISBN,
        publicationIdentifierType: identifierType
      }
    });

    const result = authorPublisherPublications
      .filter(p => _hasIdentifier(p))
      .filter(p => _modifiedBetween(p, begin, end) || _createdBetween(p, begin, end))
      .map(v => v.toJSON())
      .map(publication => _generateEntries(publication))
      .flat();

    return result;

    /**
     * Generates formatted entries from data given as parameter
     * @param {Object[]} p Publications to format
     * @returns Array of objects which are formatted to have properties similar to PIID headers
     */
    function _generateEntries(p) {
      return Object.entries(p)
        .reduce((acc, [key, value]) => {
          if (key === 'publicationIdentifierPrint' || key === 'publicationIdentifierElectronical') {
            // If value is empty, continue
            if (value === '') {
              return acc;
            }

            // Otherwise, loop through keys and make a new entry from each identifier
            return [...acc, Object.entries(JSON.parse(value)).map(([identifier, publicationFormat]) => formatPublicationToPIID(p, identifier, publicationFormat, identifierType))].flat();
          }
          return acc;
        }, []);
    }

    /**
     * Utility function to test whether publication has identifier or not
     * @param {Object} p Publication
     * @returns {boolean} True if publication has identifiers assigned to it, otherwise false
     */
    function _hasIdentifier(p) {
      return (p.publicationIdentifierPrint && p.publicationIdentifierPrint !== '') || // eslint-disable-line
        (p.publicationIdentifierElectronical && p.publicationIdentifierElectronical !== '') // eslint-disable-line
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
          käytetty: taken - canceled
        };
      }

      if (identifierType === COMMON_IDENTIFIER_TYPES.ISMN) {
        return {
          etuliite: String(prefix),
          alku: String(rangeBegin),
          loppu: String(rangeEnd),
          vapaana: free + canceled,
          käytetty: taken - canceled
        };
      }

      return {};
    }
  }

  // Does not yet have automated tests
  // Relies on using SUBSTRING-function OF SQL because automated tests utilize in-memory SQLite
  // and it does not support SQL-functions like YEAR or MONTH
  /* eslint-disable max-statements,functional/immutable-data */
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
    const messageCounts = await _getByMessageCount({beginDate, endDate});
    rows.push(_formatResultSet('Lähetetyt viestit', messageCounts, headers));

    // Get new ISBN publisher count and push formatted version to rows
    // Note: only tests creation date of publisher request, not creation date of subrange (similar to previous)
    const publisherIsbnCreatedCount = await _getCreatedPublisherCount({beginDate, endDate, identifierType: COMMON_IDENTIFIER_TYPES.ISBN});
    rows.push(_formatResultSet('Uudet kustantajat (ISBN)', publisherIsbnCreatedCount, headers));

    // Get ISMN publisher count
    const publisherIsmnCreatedCount = await _getCreatedPublisherCount({beginDate, endDate, identifierType: COMMON_IDENTIFIER_TYPES.ISMN});
    rows.push(_formatResultSet('Uudet kustantajat (ISMN)', publisherIsmnCreatedCount, headers));

    // Get count of publisher requests that have come through WEB interface using default WEB user
    const publisherRegistrationCount = await _getCreatedPublisherRequests({beginDate, endDate});
    rows.push(_formatResultSet('Kustantajarekisterin liittymislomakkeet', publisherRegistrationCount, headers));

    // Get new ISBN application count
    const publicationRegistrationIsbnCount = await _getCreatedPublicationRequests({beginDate, endDate, identifierType: COMMON_IDENTIFIER_TYPES.ISBN});
    rows.push(_formatResultSet('ISBN hakulomakkeet', publicationRegistrationIsbnCount, headers));

    // Get new ISMN application count
    const publicationRegistrationIsmnCount = await _getCreatedPublicationRequests({beginDate, endDate, identifierType: COMMON_IDENTIFIER_TYPES.ISMN});
    rows.push(_formatResultSet('ISMN hakulomakkeet', publicationRegistrationIsmnCount, headers));

    // ISBN identifier stats

    // Get created ISBN identifier count for authorpublisher
    const createdIsbnCountAuthor = await _getCreatedIdentifierCount({beginDate, endDate, identifierType: COMMON_IDENTIFIER_TYPES.ISBN, publisherId: AUTHOR_PUBLISHER_ID_ISBN});
    rows.push(_formatResultSet('Myönnetyt ISBN-tunnukset (omakustanteet)', createdIsbnCountAuthor, headers));

    // Get created ISBN identifier count for state publisher
    const createdIsbnCountState = await _getCreatedIdentifierCount({beginDate, endDate, identifierType: COMMON_IDENTIFIER_TYPES.ISBN, publisherId: STATE_PUBLISHER_ID_ISBN});
    rows.push(_formatResultSet('Myönnetyt ISBN-tunnukset (valtio)', createdIsbnCountState, headers));

    // Get created ISBN identifier count for university publisher
    const createdIsbnCountUniversity = await _getCreatedIdentifierCount({beginDate, endDate, identifierType: COMMON_IDENTIFIER_TYPES.ISBN, publisherId: UNIVERSITY_PUBLISHER_ID_ISBN});
    rows.push(_formatResultSet('Myönnetyt ISBN-tunnukset (yliopisto)', createdIsbnCountUniversity, headers));

    // Get created ISBN identifier count regarding category 1 subranges
    const createdIsbnCountCat1 = await _getCreatedIdentifierCount({beginDate, endDate, identifierType: COMMON_IDENTIFIER_TYPES.ISBN, excludePublisherIds: excludePublisherIdsCat1, category: 1});
    rows.push(_formatResultSet('Myönnetyt ISBN-tunnukset (5-merkkiset)', createdIsbnCountCat1, headers));

    // ISMN identifier stats

    // Get created ISMN identifier count for authorpublisher
    const createdIsmnCountAuthor = await _getCreatedIdentifierCount({beginDate, endDate, identifierType: COMMON_IDENTIFIER_TYPES.ISMN, publisherId: AUTHOR_PUBLISHER_ID_ISBN});
    rows.push(_formatResultSet('Myönnetyt ISMN-tunnukset (omakustanteet)', createdIsmnCountAuthor, headers));

    // Get created ISMN identifier count regarding category 1 subranges
    const createdIsmnCountCat1 = await _getCreatedIdentifierCount({beginDate, endDate, identifierType: COMMON_IDENTIFIER_TYPES.ISMN, excludePublisherIds: excludePublisherIdsCat1, category: 1});
    rows.push(_formatResultSet('Myönnetyt ISMN-tunnukset (5-merkkiset)', createdIsmnCountCat1, headers));

    // Get modified publisher count
    const modifiedPublisherCount = await _getModifiedPublisherCount({beginDate, endDate});
    rows.push(_formatResultSet('Kustantajatietojen muokkaukset', modifiedPublisherCount, headers));

    // Return results
    return rows;

    function _formatResultSet(name, resultSet, headers) {
      // Generate result object from column information
      const result = headers.reduce((prev, k) => ({...prev, [k]: ''}), {});

      // Transform result set
      const transformedResult = resultSet
        .map(({y, m, count}) => ({[`${Number(m)} / ${y}`]: `${count}`})); // Transform keys to match dateColumn keys

      // Looping through array object keys to assign them to result
      transformedResult.forEach(v => {
        Object.keys(v).forEach(k => {
          result[k] = v[k]; // eslint-disable-line functional/immutable-data
        });
      });

      // Fill zeroes as if no entries exist, this is formatted as zero
      Object.keys(result).forEach(k => {
        /* eslint-disable functional/no-conditional-statements */
        if (result[k] === '') {
          result[k] = '0';
        }
      });

      // Add name information to row
      result['Tilaston tyyppi'] = name;

      return result;
    }
  }
  /* eslint-enable max-statements,functional/immutable-data */


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

        results.push(`${month} / ${year}`); // eslint-disable-line functional/immutable-data
        return;
      });
    });

    return results;
  }

  /**
   * Utility function to determine whether entity was created between
   * @param {Object} entity Entity to evaluate
   * @param {string} begin Begin on time period
   * @param {string} end End of time period
   * @returns True if entity created value was between the begin and end parameters, otherwise false
   */
  function _createdBetween(entity, begin, end) {
    // Entity created attribute is already instanceof Date
    const endDate = new Date(end);
    endDate.setHours(23);
    endDate.setMinutes(59);
    endDate.setSeconds(59);
    return entity.created >= new Date(begin) && entity.created <= endDate;
  }

  /**
   * Utility function to determine whether entity was modified between
   * @param {Object} entity Entity to evaluate
   * @param {string} begin Begin on time period
   * @param {string} end End of time period
   * @returns True if entity created value was between the begin and end parameters, otherwise false
   */
  function _modifiedBetween(entity, begin, end) {
    // Entity modified attribute is already instanceof Date
    const endDate = new Date(end);
    endDate.setHours(23);
    endDate.setMinutes(59);
    endDate.setSeconds(59);

    return entity.modified >= new Date(begin) && entity.modified <= endDate;
  }

  /**
   * Get association models for selected identifier type
   * @param {string} identifierType Type of identifiers to get association models for
   * @returns Object containing subrange and canceledSubrange models
   */
  function _getAssociations(identifierType) {
    if (identifierType === COMMON_IDENTIFIER_TYPES.ISBN) {
      return {
        subRange: 'isbnSubRanges',
        canceledSubRange: 'canceledIsbnSubRanges'
      };
    }

    if (identifierType === COMMON_IDENTIFIER_TYPES.ISMN) {
      return {
        subRange: 'ismnSubRanges',
        canceledSubRange: 'canceledIsmnSubRanges'
      };
    }

    return {};
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
  // These contain Sequelize ORM queries for retrieving statistics
  async function _getByMessageCount({beginDate, endDate}) { // eslint-disable-line require-await
    return messageIsbnModel.findAll({
      attributes: [
        [literal('COUNT(DISTINCT(id))'), 'count'],
        [literal(`SUBSTRING(sent, 1, 4)`), 'y'],
        [literal(`SUBSTRING(sent, 6, 2)`), 'm']
      ],
      where: {
        sent: {
          [Op.between]: [beginDate, endDate]
        }
      },
      group: ['y', 'm'],
      raw: true
    });
  }

  async function _getCreatedPublisherCount({beginDate, endDate, identifierType}) { // eslint-disable-line require-await
    const include = _getInclude(identifierType);

    return publisherIsbnModel.findAll({
      include,
      attributes: [
        [literal('COUNT(DISTINCT(publisherIsbn.id))'), 'count'],
        [literal(`SUBSTRING(publisherIsbn.created, 1, 4)`), 'y'],
        [literal(`SUBSTRING(publisherIsbn.created, 6, 2)`), 'm']
      ],
      where: {
        created: {
          [Op.between]: [beginDate, endDate]
        }
      },
      group: ['y', 'm'],
      raw: true
    });

    function _getInclude(identifierType) {
      if (identifierType === COMMON_IDENTIFIER_TYPES.ISBN) {
        return {
          association: 'isbnSubRanges',
          attributes: [],
          required: true // Note: enforces INNER JOIN
        };
      }
      if (identifierType === COMMON_IDENTIFIER_TYPES.ISMN) {
        return {
          association: 'ismnSubRanges',
          attributes: [],
          required: true // Note: enforces INNER JOIN
        };
      }

      throw new Error('Invalid identifier type definition!');
    }
  }

  async function _getCreatedPublisherRequests({beginDate, endDate}) { // eslint-disable-line require-await
    return publisherIsbnModel.findAll({
      attributes: [
        [literal('COUNT(DISTINCT(id))'), 'count'],
        [literal(`SUBSTRING(created, 1, 4)`), 'y'],
        [literal(`SUBSTRING(created, 6, 2)`), 'm']
      ],
      where: {
        created: {
          [Op.between]: [beginDate, endDate]
        },
        createdBy: WEBSITE_USER
      },
      group: ['y', 'm'],
      raw: true
    });
  }

  async function _getCreatedPublicationRequests({beginDate, endDate, identifierType}) { // eslint-disable-line require-await
    const conditions = _getConditions(identifierType);

    return publicationIsbnModel.findAll({
      attributes: [
        [literal('COUNT(DISTINCT(id))'), 'count'],
        [literal(`SUBSTRING(created, 1, 4)`), 'y'],
        [literal(`SUBSTRING(created, 6, 2)`), 'm']
      ],
      where: {
        ...conditions,
        created: {
          [Op.between]: [beginDate, endDate]
        },
        createdBy: WEBSITE_USER
      },
      group: ['y', 'm'],
      raw: true
    });

    function _getConditions(identifierType) {
      if (identifierType === COMMON_IDENTIFIER_TYPES.ISBN) {
        return {
          publicationType: {
            [Op.ne]: ISBN_REGISTRY_PUBLICATION_TYPES.SHEET_MUSIC
          }
        };
      }

      if (identifierType === COMMON_IDENTIFIER_TYPES.ISMN) {
        return {
          publicationType: ISBN_REGISTRY_PUBLICATION_TYPES.SHEET_MUSIC
        };
      }

      return undefined;
    }
  }

  async function _getCreatedIdentifierCount({beginDate, endDate, identifierType, publisherId, excludePublisherIds, category}) {
    const identifierSubRangeModel = _getSubRangeModel(identifierType);
    const subRangeConditions = _getSubRangeConditions({publisherId, excludePublisherIds, category});

    // Find subranges
    const subRangeResult = await identifierSubRangeModel.findAll({
      attributes: ['id'],
      where: {
        ...subRangeConditions
      }
    });

    const subrangeIds = subRangeResult.map(({id}) => id);

    // If there were no subranges found, empty set is returned
    if (subrangeIds.length === 0) {
      return [];
    }

    // Find batches which correspond with identifier type and subrange id
    return identifierBatchModel.findAll({
      include: {
        association: 'identifiers',
        attributes: [],
        required: true
      },
      attributes: [
        [fn('COUNT', col('identifiers.id')), 'count'],
        [literal(`SUBSTRING(identifierBatch.created, 1, 4)`), 'y'],
        [literal(`SUBSTRING(identifierBatch.created, 6, 2)`), 'm']
      ],
      where: {
        identifierType,
        created: {
          [Op.between]: [beginDate, endDate]
        },
        subRangeId: {
          [Op.in]: subrangeIds
        }
      },
      group: ['y', 'm'],
      raw: true
    });

    function _getSubRangeConditions({publisherId, excludePublisherIds, category}) {
      /* eslint-disable functional/immutable-data */
      const result = {};

      if (publisherId) {
        result.publisherId = publisherId;
      } else if (excludePublisherIds) {
        result.publisherId = {
          [Op.notIn]: excludePublisherIds
        };
      }

      if (category) {
        result.category = category;
      }

      return result;
      /* eslint-enable functional/immutable-data */
    }

    function _getSubRangeModel(identifierType) {
      if (identifierType === COMMON_IDENTIFIER_TYPES.ISBN) {
        return sequelize.models.isbnSubRange;
      }

      if (identifierType === COMMON_IDENTIFIER_TYPES.ISMN) {
        return sequelize.models.ismnSubRange;
      }

      return undefined;
    }
  }

  async function _getModifiedPublisherCount({beginDate, endDate}) { // eslint-disable-line require-await
    return publisherIsbnModel.findAll({
      attributes: [
        [literal('COUNT(DISTINCT(id))'), 'count'],
        [literal(`SUBSTRING(modified, 1, 4)`), 'y'],
        [literal(`SUBSTRING(modified, 6, 2)`), 'm']
      ],
      where: {
        modified: {
          [Op.between]: [beginDate, endDate]
        }
      },
      group: ['y', 'm'],
      raw: true
    });
  }
}
