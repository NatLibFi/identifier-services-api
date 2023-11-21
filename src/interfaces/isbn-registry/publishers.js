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

/* eslint-disable max-lines */

import HttpStatus from 'http-status';
import {Op} from 'sequelize';
import {createLogger} from '@natlibfi/melinda-backend-commons/dist/utils';

import * as xl from 'excel4node';

import sequelize from '../../models';
import {ApiError, isAdmin} from '../../utils';
import {COMMON_IDENTIFIER_TYPES, ISBN_REGISTRY_ISBN_RANGE_LENGTH, ISBN_REGISTRY_ISMN_RANGE_LENGTH} from '../constants';
import {generateQuery, emptyQueryResult} from '../interfaceUtils';

import regexPatterns from '../../routes/validations/patterns';

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
    readPublic,
    query,
    queryPublic,
    update,
    autoComplete,
    getEmailList,
    getInformationPackage
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

      logger.warn(`Non-admin user used legacy, now admin-only, interface`);

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
   * Read public information from publisher registry entry.
   * @param {number} id ID of publisher to read
   * @returns {Object} Publisher as object containing public attributes
   */
  async function readPublic(id) {
    const result = await publisherModel.findByPk(id, {
      attributes: [
        'id',
        'officialName',
        'previousNames',
        'otherNames',
        'address',
        'hasQuitted',
        'city',
        'zip',
        'phone',
        'www',
        'activeIdentifierIsbn',
        'activeIdentifierIsmn'
      ],
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

    if (result !== null && _isPublisherRegistryEntry(result)) {
      const {
        officialName,
        previousNames,
        otherNames,
        address,
        hasQuitted,
        city,
        zip,
        phone,
        www,
        isbnSubRanges,
        ismnSubRanges,
        activeIdentifierIsbn,
        activeIdentifierIsmn
      } = result.toJSON();

      return {
        id,
        officialName,
        previousNames,
        otherNames,
        address,
        hasQuitted,
        city,
        zip,
        phone,
        www,
        isbnSubRanges,
        ismnSubRanges,
        activeIdentifierIsbn,
        activeIdentifierIsmn
      };
    }

    if (result !== null && !_isPublisherRegistryEntry(result)) { // eslint-disable-line
      logger.info('Publisher with id exists but is not part of publisher registry');
    }

    throw new ApiError(HttpStatus.NOT_FOUND);
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
   * Query publisher registry publishers for admin level users.
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
        // Edge case: there are no ISMN publisher identifiers that start the defined regexp
        // May skip db query alltogether
        if (identifierType === COMMON_IDENTIFIER_TYPES.ISMN) {
          return emptyQueryResult;
        }

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
        // Edge case: there are no ISBN publisher identifiers that start the defined regexp
        // May skip db query alltogether
        if (identifierType === COMMON_IDENTIFIER_TYPES.ISBN) {
          return emptyQueryResult;
        }

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
      // Search by attributes other than publisher identifier

      // Define free-text search attributes
      const textSearchAttributes = _determineQueryAttributes(user); // Admin users may query all attributes, other users only a selected set
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
            {
              [Op.or]: [
                {'$isbnSubRanges.publisher_identifier$': {[Op.ne]: ''}},
                {'$ismnSubRanges.publisher_identifier$': {[Op.ne]: ''}}
              ]
            },
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

      logger.warn(`Non-admin user used legacy, now admin-only, interface`);

      // Otherwise, return pre-defined, filtered, set of information
      const {id, officialName, otherNames, hasQuitted, activeIdentifierIsbn, activeIdentifierIsmn} = doc;
      return {id, officialName, otherNames, hasQuitted, activeIdentifierIsbn, activeIdentifierIsmn};
    }
  }
  /* eslint-enable max-statements */

  /**
   * Public query publisher functionality.
   * @param {Object} guiOpts Search options
   * @returns Result set of the query
   */
  /* eslint-disable max-statements,complexity */
  async function queryPublic(guiOpts) {
    // NOTE: there exists a known, most likely a sequelize-related, bug regarding the row set being limited incorrectly.
    // Basically the reason seems to be that the duplicate entries are cut from the resulting rows attribute after the limiter
    // has been evaluated in the database query. At the time of writing, this bug remains unsolved.

    /* eslint-disable functional/no-let */
    const attributes = ['id', 'officialName', 'otherNames', 'hasQuitted', 'activeIdentifierIsbn', 'activeIdentifierIsmn'];
    const {searchText, offset = 0, limit = 10} = guiOpts;
    const order = [['id', 'DESC']];
    const trimmedSearchText = searchText ? searchText.trim() : undefined;

    let publisherIds = null; // Utilized in queries using publisher identifier
    /* eslint-enable functional/no-let */

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
          .map(v => _filterResult(v));

        return {totalDoc: result.count, results: filteredResult};
      }
    } else {
      // Search by attributes other than identifier

      // Define free-text search attributes
      const textSearchAttributes = ['officialName', 'otherNames', 'previousNames'];
      const textConditions = trimmedSearchText ? {[Op.or]: generateQuery(textSearchAttributes, trimmedSearchText)} : undefined;

      // Query must be done in two parts and without including association attributes because sequelize cannot handle group by
      // together with findAndCountAll and full group by limitation cannot be satisfied otherwise. See e.g.,: https://github.com/sequelize/sequelize/issues/6148
      const queryParams = {
        where: {
          [Op.and]: [
            {...textConditions},
            {
              [Op.or]: [
                {'$isbnSubRanges.publisher_identifier$': {[Op.ne]: ''}},
                {'$ismnSubRanges.publisher_identifier$': {[Op.ne]: ''}}
              ]
            }
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
          .map(v => _filterResult(v));

        // Finally, return results
        return {totalDoc: countResult, results: filteredResult};
      }
    }

    // Return empty result if no result could be found
    return emptyQueryResult;

    /**
   * Filters result attributes to the ones available for everybody
   * @param {Object} doc Publisher registry entry object
   * @returns {Object} Publisher object with attributes filtered
   */
    function _filterResult(doc) {
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
          {
            [Op.or]: [
              {'$isbnSubRanges.publisher_identifier$': {[Op.ne]: ''}},
              {'$ismnSubRanges.publisher_identifier$': {[Op.ne]: ''}}
            ]
          }
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

  /**
   * Method for getting publisher email list for group emailing purposes
   * @param {Object} opts Filter options
   * @returns Object containing data property, which contains array of ISBN-registry publisher emails
   */
  async function getEmailList(opts) {
    validateOpts(opts);

    const {category, identifierType, langCode} = opts;

    // Subrange category is calculated by: TYPE_RANGE_LENGTH - RANGE_CATEGORY
    const subrangeCategory = calculateSubrangeCategory(category, identifierType);
    const subrangeModel = getSubrangeModel(identifierType);

    const publisherIds = await subrangeModel.findAll({
      attributes: ['publisherId'],
      where: {
        category: subrangeCategory
      }
    });

    const formattedPublisherIds = publisherIds.reduce((prev, cur) => {
      const {publisherId} = cur;
      if (!publisherId) {
        return prev;
      }

      return [...prev, publisherId];
    }, []);

    const result = await publisherModel.findAll({
      attributes: ['email'],
      where: {
        [Op.and]: [{id: formattedPublisherIds}, {langCode}]
      }
    });

    return result
      .map(({email}) => email)
      .filter(isValidEmail);

    function calculateSubrangeCategory(category, identifierType) {
      if (identifierType === COMMON_IDENTIFIER_TYPES.ISBN) {
        return ISBN_REGISTRY_ISBN_RANGE_LENGTH - category;
      }

      if (identifierType === COMMON_IDENTIFIER_TYPES.ISMN) {
        return ISBN_REGISTRY_ISMN_RANGE_LENGTH - category;
      }

      throw new Error('Invalid identifier type');
    }

    function validateOpts(opts) {
      const {category, identifierType} = opts;

      if (identifierType === COMMON_IDENTIFIER_TYPES.ISBN && (category < 1 || category > 5)) {
        throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'Invalid category definition for ISBN publisher');
      }

      if (identifierType === COMMON_IDENTIFIER_TYPES.ISMN && ![3, 5, 6, 7].includes(category)) {
        throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'Invalid category definition for ISMN publisher');
      }
    }

    function getSubrangeModel(identifierType) {
      if (identifierType === COMMON_IDENTIFIER_TYPES.ISBN) {
        return isbnSubRangeModel;
      }

      if (identifierType === COMMON_IDENTIFIER_TYPES.ISMN) {
        return ismnSubRangeModel;
      }

      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'Invalid identifier type selected');
    }

    function isValidEmail(email) {
      return email && typeof email === 'string' && regexPatterns.email.test(email);
    }
  }

  /**
   * Method for creating publisher information package regarding the publisher information saved to registry.
   * @param {number} publisherId ID of publisher
   * @param {Object} user User making the request
   * @param {string} format format in which to construct the package
   * @returns Object containing data in chosen format
   */
  async function getInformationPackage(publisherId, user, format = 'json') {
    // Sanity check
    if (!isAdmin(user)) {
      throw new ApiError(HttpStatus.FORBIDDEN, 'Forbidden');
    }

    const result = await publisherModel.findByPk(publisherId, {
      // Note: Attributes specifications by superusers
      attributes: [
        'officialName',
        'otherNames',
        'previousNames',
        'address',
        'addressLine1',
        'zip',
        'city',
        'phone',
        'email',
        'www',
        'langCode',
        'contactPerson',
        'yearQuitted',
        'hasQuitted',
        'frequencyCurrent',
        'frequencyNext',
        'affiliateOf',
        'affiliates',
        'distributorOf',
        'distributors',
        'classification',
        'classificationOther'
      ],
      include: [
        {
          association: 'archiveRecord',
          attributes: [
            'officialName',
            'otherNames',
            'address',
            'zip',
            'city',
            'phone',
            'email',
            'www',
            'langCode',
            'contactPerson',
            'frequencyCurrent',
            'frequencyNext',
            'affiliateOf',
            'affiliates',
            'distributorOf',
            'distributors',
            'classification',
            'classificationOther'
          ]
        },
        {
          association: 'isbnSubRanges',
          attributes: ['publisherIdentifier']
        },
        {
          association: 'ismnSubRanges',
          attributes: ['publisherIdentifier']
        }
      ]
    });

    if (!result || !_isPublisherRegistryEntry(result)) {
      throw new ApiError(HttpStatus.NOT_FOUND);
    }

    // For testing purposes: always keep JSON aligned with the input that is to be transformed to XLSX
    const resultAsJson = result.toJSON();
    if (format === 'json') {
      return resultAsJson;
    }

    return formatToXlsx(resultAsJson);


    function formatToXlsx(data) {
      const formattedAndTranslatedData = reformatAndTranslateJsonData(data);

      const wb = new xl.Workbook({author: 'National Library of Finland'});
      const ws = wb.addWorksheet('Kustantajan tiedot');
      writeData(formattedAndTranslatedData, ws);

      return wb;

      function writeData(jsonData, ws) {
        // First objects attributes are used as headers
        const headers = Object.keys(jsonData);

        // Columns generation loop
        headers.forEach((header, idx) => {
          const columnIdx = idx + 1;
          ws.cell(1, columnIdx)
            .string(String(header))
            .style({font: {bold: true}});

          // Write data to row 2
          const rowIdx = 2;
          ws.cell(rowIdx, columnIdx).string(String(jsonData[header]));
        });

        return ws;
      }

      function translatePublisherInformationRecordKey(recordKey) {
        const translations = {
          'officialName': 'Kustantajan nimi',
          'otherNames': 'Muut nimimuodot',
          'previousNames': 'Aikaisemmat nimet',
          'address': 'Lähiosoite',
          'addressLine1': 'Lisäosoiterivi',
          'zip': 'Postinumero',
          'city': 'Postitoimipaikka',
          'phone': 'Puhelinnumero',
          'email': 'Sähköpostiosoite',
          'www': 'Verkkosivu',
          'langCode': 'Asiointikieli',
          'contactPerson': 'Yhteyshenkilön nimi',
          'yearQuitted': 'Lopetusvuosi',
          'hasQuitted': 'Lopettanut toimintansa',
          'frequencyCurrent': 'Arvio kustannusmäärästä kuluvana vuonna',
          'frequencyNext': 'Arvio kustannusmäärästä tulevana vuonna',
          'affiliateOf': 'Emoyhtiö',
          'affiliates': 'Tytäryhtiöt',
          'distributorOf': 'Jakelijat',
          'distributors': 'Yhtiöt joiden jakelija tai edustaja',
          'classification': 'Kustannustoiminnan aihealueet',
          'classificationOther': 'Muu kustannustoiminnan aihealue'
        };

        if (Object.keys(translations).includes(recordKey)) {
          return translations[recordKey];
        }

        throw Error(`Unable to translate key ${recordKey}`);
      }

      function transformAndTranslatePublisherInformationRecordValue(k, recordValue) {
        if (recordValue === '' || recordValue === null || recordValue === undefined) {
          return '-';
        }

        if (typeof recordValue === 'boolean') {
          return recordValue ? 'Kyllä' : 'Ei';
        }

        if (Array.isArray(recordValue)) {
          if (recordValue.length === 0) {
            return '-';
          }

          // Translate classifications
          return k === 'classification' ? recordValue.join(', ') : recordValue.map(translateClassification).join(', ');
        }

        // Sanity check
        if (typeof recordValue !== 'string') {
          throw new Error(`Cannot export value ${recordValue} to XLSX as it is not in transformable format`);
        }

        return recordValue;
      }

      function reformatAndTranslateJsonData(jsonData) {
        const {isbnSubRanges, ismnSubRanges, archiveRecord, ...publisherBaseInformation} = jsonData;

        const result = {};

        // Add translated headings of publisher base information
        /* eslint-disable functional/immutable-data */
        Object.keys(publisherBaseInformation).forEach(k => {
          result[translatePublisherInformationRecordKey(k)] = transformAndTranslatePublisherInformationRecordValue(k, publisherBaseInformation[k]);
        });

        // Add subranges as distinct entries
        isbnSubRanges.forEach((v, i) => {
          result[`Kustantajatunnus_ISBN_${i + 1}`] = v.publisherIdentifier;
        });

        ismnSubRanges.forEach((v, i) => {
          result[`Kustantajatunnus_ISMN_${i + 1}`] = v.publisherIdentifier;
        });

        // Add archive entry if it exist. Translate keys.
        if (archiveRecord && typeof archiveRecord === 'object') {
          Object.keys(archiveRecord).forEach(k => {
            result[`Arkistotieto / ${translatePublisherInformationRecordKey(k)}`] = transformAndTranslatePublisherInformationRecordValue(k, archiveRecord[k]);
          });
        } else {
          result.Arkistotieto = 'Ei ole';
        }

        /* eslint-enable functional/immutable-data */

        return result;
      }

      // For future reference: create a identifier-services-commons package that has shared utility functions
      // between API and various UIs (such as this translation utility)
      function translateClassification(classification) {
        const translations = [
          {label: 'Yleistä', value: '000'},
          {label: 'Kirja-Ala. Kirjastotoimi', value: '015'},
          {label: 'Oppikirjat', value: '030'},
          {label: 'Lasten ja nuorten kirjat', value: '035'},
          {label: 'Virallisjulkaisut', value: '040'},
          {label: 'Korkeakoulujen ja yliopistojen julkaisut', value: '045'},
          {label: 'Elektroniset julkaisut', value: '050'},
          {label: 'Audiovisuaalinen aineisto. Videot', value: '055'},
          {label: 'Filosofia', value: '100'},
          {label: 'Psykologia', value: '120'},
          {label: 'Paranormaalit ilmiöt. Okkultismi. Astrologia', value: '130'},
          {label: 'Uskonto. Teologia', value: '200'},
          {label: 'Kristinusko', value: '210'},
          {label: 'Ortodoksinen kirkko', value: '211'},
          {label: 'Muut uskonnot', value: '270'},
          {label: 'Yhteiskuntatieteet. Sosiologia', value: '300'},
          {label: 'Poliittinen tutkimus. Kansainvälinen politiikka', value: '310'},
          {label: 'Sotatiede', value: '315'},
          {label: 'Sosiologia', value: '316'},
          {label: 'Taloustieteet', value: '320'},
          {label: 'Oikeus', value: '330'},
          {label: 'Julkinen hallinto', value: '340'},
          {label: 'Kasvatus. Opetus. Koulutus.', value: '350'},
          {label: 'Perinnetieteet', value: '370'},
          {label: 'Kotiseutututkimus', value: '375'},
          {label: 'Sosiaalipolitiikka. Sosiaalihuolto', value: '380'},
          {label: 'Joukkotiedotus. Media', value: '390'},
          {label: 'Kirjallisuudentutkimus', value: '400'},
          {label: 'Kaunokirjallisuus', value: '410'},
          {label: 'Runous', value: '420'},
          {label: 'Sarjakuvat', value: '440'},
          {label: 'Science Fiction', value: '450'},
          {label: 'Rikosromaanit', value: '460'},
          {label: 'Kielitiede', value: '470'},
          {label: 'Seksuaaliset vähemmistöt', value: '480'},
          {label: 'Vähemmistöt', value: '490'},
          {label: 'Luonnontieteet', value: '500'},
          {label: 'Matematiikka. Tilastotiede', value: '510'},
          {label: 'Tähtitiede', value: '520'},
          {label: 'Fysiikka', value: '530'},
          {label: 'Kemia', value: '540'},
          {label: 'Geologia', value: '550'},
          {label: 'Biologia', value: '560'},
          {label: 'Eläintiede', value: '570'},
          {label: 'Kasvitiede', value: '580'},
          {label: 'Ympäristötieteet. Ympäristönsuojelu', value: '590'},
          {label: 'Teknologia', value: '600'},
          {label: 'Insinööritieteet. Tekniikka', value: '610'},
          {label: 'Teollisuuden alat', value: '620'},
          {label: 'Rakentaminen', value: '621'},
          {label: 'Liikenne. Posti', value: '622'},
          {label: 'Tietotekniikka. Viestintätekniikka', value: '630'},
          {label: 'Lääketiede. Psykiatria', value: '640'},
          {label: 'Hammaslääketiede', value: '650'},
          {label: 'Eläinlääketiede', value: '660'},
          {label: 'Farmasia. Homeopatia', value: '670'},
          {label: 'Metsätalous. Metsänhoito', value: '672'},
          {label: 'Maatalous', value: '680'},
          {label: 'Käsi- ja kotiteollisuus', value: '690'},
          {label: 'Taide', value: '700'},
          {label: 'Esittävät taiteet', value: '710'},
          {label: 'Teatteri. Elokuva', value: '720'},
          {label: 'Tanssi', value: '730'},
          {label: 'Kuvataiteet', value: '740'},
          {label: 'Taidehistoria', value: '750'},
          {label: 'Arkkitehtuuri. Taideteollisuus', value: '760'},
          {label: 'Muoti', value: '765'},
          {label: 'Musiikki', value: '770'},
          {label: 'Antiikki. Keräily', value: '780'},
          {label: 'Kaupunki- ja aluesuunnittelu', value: '790'},
          {label: 'Huvit ja harrastukset', value: '800'},
          {label: 'Urheilu', value: '810'},
          {label: 'Pelit', value: '820'},
          {label: 'Metsästys ja kalastus', value: '830'},
          {label: 'Puutarhanhoito', value: '840'},
          {label: 'Kotitalous', value: '850'},
          {label: 'Kauneus ja terveys', value: '860'},
          {label: 'Valokuvaus', value: '870'},
          {label: 'Matkailu', value: '880'},
          {label: 'Huumori', value: '890'},
          {label: 'Historia', value: '900'},
          {label: 'Maantiede', value: '910'},
          {label: 'Kartat ja kartastot', value: '920'},
          {label: 'Arkeologia', value: '930'},
          {label: 'Sukututkimus', value: '940'},
          {label: 'Numismatiikka', value: '950'}
        ];

        const translation = translations.find(({value}) => value === classification);

        if (!translation) {
          throw new ApiError(HttpStatus.CONFLICT, `Could not find translation for classification class ${classification}`);
        }

        return translation;
      }
    }
  }
}
