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

/* Based on original work by Petteri Kivimäki (Identifier Registry) */

import HttpStatus from 'http-status';
import {Op} from 'sequelize';
import {createLogger} from '@natlibfi/melinda-backend-commons/dist/utils';

import sequelize from '../../models';
import {ApiError, isAdmin} from '../../utils';
import {COMMON_IDENTIFIER_TYPES, ISBN_REGISTRY_ISBN_RANGE_LENGTH, ISBN_REGISTRY_ISMN_RANGE_LENGTH} from '../constants';
import {generateQuery, emptyQueryResult} from '../interfaceUtils';

/**
 * ISBN publishers interface. Contains read, query and update operations.
 * @returns Interface to interact with ISBN publishers that are part of publisher registry
 */
export default function () {
  const logger = createLogger();

  const publisherModel = sequelize.models.publisherIsbn;
  const isbnSubRangeModel = sequelize.models.isbnSubRange;
  const ismnSubRangeModel = sequelize.models.ismnSubRange;

  return {
    read,
    query,
    update,
    autoComplete
  };

  /**
   * Read publisher registry entry. Attributes returned depend on user role.
   * @param {number} id ID of publisher to read
   * @param {Object} user User making the request
   * @returns {Object} Publisher as object containing the attribute information appropriate to user
   */
  async function read(id, user) {

    const result = await publisherModel.findByPk(id, {
      include: [
        {
          association: 'isbnSubRanges',
          attributes: ['id', 'publisherIdentifier', 'free', 'canceled', 'isActive', 'created', 'createdBy']
        },
        {
          association: 'ismnSubRanges',
          attributes: ['id', 'publisherIdentifier', 'free', 'canceled', 'isActive', 'created', 'createdBy']
        }
      ]
    });

    if (result !== null && _isPublisherRegistryEntry(result)) {
      const formattedResult = result.toJSON();
      return _filterResult(formattedResult, user);
    }

    if (result !== null && !_isPublisherRegistryEntry(result)) { // eslint-disable-line
      logger.info('Publisher with id exists but is not part of publisher registry');
    }

    throw new ApiError(HttpStatus.NOT_FOUND);

    /**
   * Filters result attributes based on whether user has admin access or not
   * @param {Object} doc Publisher registry entry object
   * @param {Object} user User object
   * @returns {Object} Publisher object with attributes filtered appropriate to user permissions
   */
    function _filterResult(doc, user) {
      if (isAdmin(user)) {
      // Remove category information, etc. regarding subranges from response as it's not useful
        const formattedIsbnSubranges = doc.isbnSubRanges
          .map(({id, publisherIdentifier, free, canceled, isActive, created, createdBy}) => ({id, publisherIdentifier, free, canceled, isActive, created, createdBy}));
        const formattedIsmnSubranges = doc.ismnSubRanges
          .map(({id, publisherIdentifier, free, canceled, isActive, created, createdBy}) => ({id, publisherIdentifier, free, canceled, isActive, created, createdBy}));

        return {...doc, isbnSubRanges: formattedIsbnSubranges, ismnSubRanges: formattedIsmnSubranges};
      }

      const {id, officialName, previousNames, otherNames, address, hasQuitted,
        city, zip, phone, www, isbnSubRanges, ismnSubRanges, activeIdentifierIsbn, activeIdentifierIsmn} = doc;

      // Format subrange information, for public allow only id and publisherIdentifier
      const formattedIsbnSubranges = isbnSubRanges.map(({id, publisherIdentifier}) => ({id, publisherIdentifier}));
      const formattedIsmnSubranges = ismnSubRanges.map(({id, publisherIdentifier}) => ({id, publisherIdentifier}));

      return {
        id, officialName, previousNames, otherNames, address, hasQuitted, city, zip, phone, www,
        isbnSubRanges: formattedIsbnSubranges, ismnSubRanges: formattedIsmnSubranges, activeIdentifierIsbn, activeIdentifierIsmn
      };
    }

  }

  /**
   * Update publisher registry entry. Note: cannot update publisher registry request that has not been approved
   * (i.e., does not have any ISBN/ISMN publisher identifier)
   * @param {number} id Publisher registry entry id to update
   * @param {Object} doc Attributes to update
   * @param {Object} user User making the request
   * @returns {Object} Updated publisher registry entry
   */
  /* eslint-disable max-statements */
  async function update(id, doc, user) {

    // Note: associations must be included so it can be known if
    // entity considers publisher registry entry or publisher registry request
    const publisher = await publisherModel.findByPk(id, {
      include: [
        {
          association: 'isbnSubRanges',
          attributes: ['id', 'publisherIdentifier']
        },
        {
          association: 'ismnSubRanges',
          attributes: ['id', 'publisherIdentifier']
        }
      ]
    });

    if (publisher !== null && _isPublisherRegistryEntry(publisher)) {
      const publisherJson = publisher.toJSON();

      // Remove attributes not allowed to update/overwrite
      /* eslint-disable no-unused-vars */
      const {
        activeIdentifierIsbn,
        activeIdentifierIsmn,
        confirmation,
        createdBy,
        ...dbDoc
      } = {...doc, modifiedBy: user.id};
      /* eslint-enable no-unused-vars */

      if (_modifiesProtectedAttributes(publisherJson, doc)) {
        throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'Cannot update value of protected attribute');
      }

      // Update to db
      await publisher.update(dbDoc);

      // Return result of read operation to get associations included to response
      return read(id, user);
    }

    throw new ApiError(HttpStatus.NOT_FOUND);
  }
  /* eslint-enable max-statements */

  /**
   * Query publisher registry publishers. Some attributes are available to search only for admin or higher
   * level users.
   * @param {Object} guiOpts Search options
   * @param {Object} user User making the request
   * @returns Result set of the query
   */
  /* eslint-disable max-statements,complexity */
  async function query(guiOpts, user) {
    // NOTE: there exists a known, most likely a sequelize-related, bug regarding the row set being limited incorrectly.
    // Basically the reason seems to be that the duplicate entries are cut from the resulting rows attribute after the limiter
    // has been evaluated in the database query. At the time of writing, this bug remains unsolved.


    /* eslint-disable functional/no-let */
    const attributes = ['id', 'officialName', 'otherNames', 'email', 'contactPerson', 'hasQuitted', 'activeIdentifierIsbn', 'activeIdentifierIsmn'];
    const {searchText, hasQuitted, category, identifierType, offset = 0, limit = 10} = guiOpts;
    const order = [['id', 'DESC'], ['promoteSorting', 'DESC']];
    const trimmedSearchText = searchText ? searchText.trim() : undefined;

    let publisherIds = null; // Utilized in queries using publisher identifier
    /* eslint-enable functional/no-let */

    // Set of properties are allowed only for admin users, if attempt to use these, throw a error
    if (!isAdmin(user)) {
      if (typeof hasQuitted !== 'undefined' || typeof category !== 'undefined' || typeof identifierType !== 'undefined') {
        logger.warn('Non-admin user attempted to utilize admin-only attributes in publisher registry search');
        throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'Only admin users are allowed to use extended filters in publisher queries. Please login to continue.');
      }
    }

    // Search by identifier, populate matching publisher IDs
    // ISBN publisher identifier
    if (trimmedSearchText) {

      if (trimmedSearchText.match(/^97(?:8|9)-(?:951|952)-\d+/u) !== null) {

        const subrangeResult = await sequelize.models.isbnSubRange.findAll({
          attributes: ['publisherId'],
          where: {
            publisherIdentifier: {
              [Op.like]: `${trimmedSearchText}%`
            }
          },
          distinct: true,
          order: [['publisherId', 'DESC']]
        });

        if (!subrangeResult || subrangeResult.length === 0) {
          return emptyQueryResult;
        }

        publisherIds = subrangeResult.map(v => v.publisherId);
      } else if (trimmedSearchText.match(/^979-0-\d+/u) !== null) {

        // ISMN publisher identifier
        const subrangeResult = await sequelize.models.ismnSubRange.findAll({
          attributes: ['publisherId'],
          where: {
            publisherIdentifier: {
              [Op.like]: `${trimmedSearchText}%`
            }
          },
          distinct: true,
          order: [['publisherId', 'DESC']]
        });

        if (!subrangeResult || subrangeResult.length === 0) {
          return emptyQueryResult;
        }

        publisherIds = subrangeResult.map(v => v.publisherId);
      }
    }

    /* eslint-disable functional/no-conditional-statements */
    if (publisherIds !== null) { // eslint-disable-line no-negated-condition

      // Note: since we are using publisher IDs as base for the search, there is no need for additionally make sure
      // publisher is linked to an publisher range. ID based search is also distinct by default so no need for
      // hacks for achieving distinct result set (like in text-based search).
      const result = await publisherModel.findAndCountAll({
        attributes,
        where: {
          id: {
            [Op.in]: publisherIds
          }
        },
        limit,
        offset,
        order
      });

      if (result.count > 0) {
        const filteredResult = result.rows
          .map(v => v.toJSON())
          .map(v => _filterResult(v, user));

        return {totalDoc: result.count, results: filteredResult};
      }
    } else {
      // Search by attributes other than identifier

      // Define free-text search attributes
      const textSearchAttributes = _determineQueryAttributes(user);
      const textConditions = trimmedSearchText ? {[Op.or]: generateQuery(textSearchAttributes, trimmedSearchText)} : undefined;

      // Admin may filter based on hasQuitted attribute
      const hasQuittedCondition = hasQuitted && isAdmin(user) ? {hasQuitted} : {};

      // Admin may additionally filter based on identifier type or category
      const identifierTypeCondition = identifierType && isAdmin(user) ? identifierType : '';
      const categoryCondition = category && isAdmin(user) ? _getCategoryCondition(category, identifierType) : {};

      // Query must be done in two parts and without including association attributes because sequelize cannot handle group by
      // together with findAndCountAll and full group by limitation cannot be satisfied otherwise. See e.g.,: https://github.com/sequelize/sequelize/issues/6148
      const queryParams = {
        where: {
          [Op.and]: [
            {...textConditions},
            {...hasQuittedCondition},
            {[Op.or]: [
              {'$isbnSubRanges.publisher_identifier$': {[Op.ne]: ''}},
              {'$ismnSubRanges.publisher_identifier$': {[Op.ne]: ''}}
            ]},
            {...categoryCondition}
          ]
        },
        limit,
        offset,
        order,
        include: [
          {
            model: isbnSubRangeModel,
            as: 'isbnSubRanges',
            attributes: [],
            required: identifierTypeCondition === COMMON_IDENTIFIER_TYPES.ISBN
          },
          {
            model: ismnSubRangeModel,
            as: 'ismnSubRanges',
            attributes: [],
            required: identifierTypeCondition === COMMON_IDENTIFIER_TYPES.ISMN
          }
        ],
        subQuery: false, // Note: required for where clause with eagerly loaded associations to work together with limit/offset/order
        distinct: true, // Required for retrieving true count of distinct entries
        col: 'id' // Required for retrieving true count of distinct entries
      };

      // Grouping by publisher id is the hack to get correct rows as result
      const result = await publisherModel.findAll({...queryParams, attributes, group: ['publisherIsbn.id']});
      const countResult = await publisherModel.count({...queryParams});

      // Return result if there is one
      if (countResult > 0) {
      // Filter attributes based on user role
        const filteredResult = result
          .map(v => v.toJSON())
          .map(v => _filterResult(v, user));

        // Finally, return results
        return {totalDoc: countResult, results: filteredResult};
      }
    }

    // Return empty result if no result could be found
    return emptyQueryResult;

    function _getCategoryCondition(category, identifierType) {
      if (identifierType === COMMON_IDENTIFIER_TYPES.ISBN) {
        return {'$isbnSubRanges.category$': {[Op.eq]: ISBN_REGISTRY_ISBN_RANGE_LENGTH - category}};
      }

      if (identifierType === COMMON_IDENTIFIER_TYPES.ISMN) {
        return {'$ismnSubRanges.category$': {[Op.eq]: ISBN_REGISTRY_ISMN_RANGE_LENGTH - category}};

      }

      return undefined;
    }

    /**
     * Determines attributes that are available for user
     * @param {Object} user User object
     * @returns Array of attributes that can be used for searching publisher registry entries
     */
    function _determineQueryAttributes(user) {
      const searchAttributes = [
        'officialName',
        'otherNames',
        'previousNames'
      ];

      if (isAdmin(user)) {
        return [
          ...searchAttributes,
          'email',
          'contactPerson',
          'additionalInfo'
        ];
      }

      return searchAttributes;
    }

    /**
   * Filters result attributes based on whether user has admin access or not
   * @param {Object} doc Publisher registry entry object
   * @param {Object} user User object
   * @returns {Object} Publisher object with attributes filtered appropriate to user permissions
   */
    function _filterResult(doc, user) {
    // If user is admin or system user, return all attributes defined for db query
      if (isAdmin(user)) {
        return doc;
      }

      // Otherwise, return pre-defined, filtered, set of information
      const {id, officialName, otherNames, hasQuitted, activeIdentifierIsbn, activeIdentifierIsmn} = doc;
      return {id, officialName, otherNames, hasQuitted, activeIdentifierIsbn, activeIdentifierIsmn};
    }
  }
  /* eslint-enable max-statements */

  /**
   * Function to test whether publisherModel entry is part of publisher registry.
   * Entry is part of publisher registry if it has been given isbn publisher range or
   * ismn publisher range.
   * @param {Object} doc publisherModel entry containing isbn/ismn subrange information
   * @returns {boolean} True if entry is part of publisher registry, false if not
   */
  function _isPublisherRegistryEntry(doc) {
    // Sanity check
    if (!doc.isbnSubRanges || !doc.ismnSubRanges) {
      return false;
    }

    if (doc.isbnSubRanges.length === 0 && doc.ismnSubRanges.length === 0) {
      return false;
    }

    if (doc.isbnSubRanges.length > 0 || doc.ismnSubRanges.length > 0) {
      return true;
    }

    throw new Error('Internal server logic error in testing whether entity is publisher registry entry or publisher request');
  }

  /**
   * Test whether update would update a protected attribute
   * @param {Object} oldDoc Database document
   * @param {Object} newDoc Updated database document
   * @returns {boolean} True if updated document would overwrite protected value, otherwise false
   */
  function _modifiesProtectedAttributes(oldDoc, newDoc) {
    const protectedAttributes = [
      'id',
      'activeIdentifierIsbn',
      'activeIdentifierIsmn',
      'confirmation',
      'created',
      'createdBy',
      'modified',
      'modifiedBy'
    ];

    return protectedAttributes.map(attr => {
      if (!Object.prototype.hasOwnProperty.call(newDoc, attr)) {
        return false;
      }

      if (newDoc[attr] === oldDoc[attr]) {
        return false;
      }

      return true;
    }).some(v => v === true);
  }

  /**
   * Query publisher registry publishers for autocomplete. Separated from query endpoint to increase performance.
   * Also, for admin use only.
   * @param {Object} guiOpts Search options
   * @returns Result set of the query
   */
  /* eslint-disable max-statements,complexity */

  async function autoComplete(guiOpts) {

    /* eslint-disable functional/no-let */
    const {searchText} = guiOpts;
    const offset = 0;
    const limit = 10;
    const order = [['promoteSorting', 'DESC'], ['officialName', 'ASC']];
    const attributes = ['id', 'officialName', 'otherNames', 'previousNames'];

    // Define search
    const trimmedSearchText = searchText ? searchText.trim() : undefined;
    const textSearchAttributes = ['officialName', 'otherNames', 'previousNames'];
    const textConditions = trimmedSearchText ? {[Op.or]: generateQuery(textSearchAttributes, trimmedSearchText)} : undefined;

    // DB query
    const result = await publisherModel.findAll({
      attributes,
      where: {
        [Op.and]: [
          {...textConditions},
          {[Op.or]: [
            {'$isbnSubRanges.publisher_identifier$': {[Op.ne]: ''}},
            {'$ismnSubRanges.publisher_identifier$': {[Op.ne]: ''}}
          ]}
        ]
      },
      limit,
      offset,
      order,
      include: [
        {
          model: isbnSubRangeModel,
          as: 'isbnSubRanges',
          attributes: []
        },
        {
          model: ismnSubRangeModel,
          as: 'ismnSubRanges',
          attributes: []
        }
      ],
      subQuery: false, // Note: required for where clause with eagerly loaded associations to work together with limit/offset/order
      distinct: true, // Required for retrieving true count of distinct entries
      col: 'id', // Required for retrieving true count of distinct entries
      group: ['publisherIsbn.id'] // Required to receive distinct result set
    });

    return result.map(item => item.toJSON());
  }
}
