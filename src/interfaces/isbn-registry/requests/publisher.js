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
import {createLogger} from '@natlibfi/melinda-backend-commons';

import sequelize from '../../../models';
import {ApiError} from '../../../utils';
import {ISBN_EMAIL, NODE_ENV, SEND_EMAILS, WEBSITE_USER} from '../../../config';
import {generateQuery} from '../../interfaceUtils';
import {getTestPrefixedMessageBody, getTestPrefixedSubject, sendEmail} from '../../common/utils/messageUtils';
import abstractModelInterface from '../../common/abstractModelInterface';

/**
 * Publisher registry request interface. Contains create, read and query operations and a number of helper functions.
 * @returns Interface to interact with publisher registry requests
 */
export default function () {
  const logger = createLogger();

  const publisherModel = sequelize.models.publisherIsbn;
  const publisherArchiveRecordsModel = sequelize.models.publisherIsbnArchiveRecord;

  const publicationModel = sequelize.models.publicationIsbn;
  const identifierBatchModel = sequelize.models.identifierBatch;
  const messageIsbnModel = sequelize.models.messageIsbn;

  const publisherModelInterface = abstractModelInterface(publisherModel);

  return {
    create,
    read,
    update,
    remove,
    query
  };

  /**
   * Creates publisher request entry to database
   * @param {Object} doc Request information document
   * @param {Object} user User initiating the request
   * @returns Created resource as object
   */
  // eslint-disable-next-line max-statements
  async function create(doc, user) {
    // Start transaction
    const t = await sequelize.transaction();

    try {
      const dbDoc = {
        ...doc,
        yearQuitted: '', // Passing hardcoded string here as this is done in previous system also instead of using db default value
        confirmation: `SYSTEM`, // SYSTEM confirmation
        createdBy: user ? user.id : WEBSITE_USER,
        modifiedBy: user ? user.id : WEBSITE_USER
      };

      // Create db entity
      const result = await publisherModelInterface.create(dbDoc, t);

      // Publisher archive entry is created always when request comes through web form
      const archiveDbDoc = _generateArchiveRecord(dbDoc, result.id);
      await publisherArchiveRecordsModel.create(archiveDbDoc, {transaction: t});

      // Commit transaction
      await t.commit();

      // Inform customer that the request was successfully received if system is configured to send emails
      // and user who initiated the request is not logged in
      /* eslint-disable no-process-env,functional/no-let,functional/no-conditional-statements */
      if (!user && SEND_EMAILS) {
        let messageBody = 'Liittymislomakkeenne ISBN-/ISMN-järjestelmään on vastaanotettu. Lomakkeet käsitellään saapumisjärjestyksessä.<br /><br />Ystävällisin terveisin,<br />ISBN-keskus';
        let subject = 'Liittymislomakkeenne ISBN-/ISMN-järjestelmään on vastaanotettu';
        logger.info('Start sending email message using email service');

        // If email is not send in production context, add flag regarding test system
        if (NODE_ENV !== 'production') {
          logger.info('Current environment is not production. Appending test prefix to message.');
          messageBody = getTestPrefixedMessageBody(messageBody);
          subject = getTestPrefixedSubject(subject);
        }

        const messageOptions = {
          from: ISBN_EMAIL,
          to: doc.email,
          subject,
          html: messageBody
        };

        // Try-catch here so that the failure in sending email will not result into overall error response
        try {
          await sendEmail(messageOptions);
        } catch (_) {
          logger.error('Encountered error when attempting to send ISBN registry publisher request confirmation email using nodemailer.');
        }
      }
      /* eslint-enable no-process-env,functional/no-let,functional/no-conditional-statements */

      // Return saved publisher information
      return result.toJSON();
    } catch (err) {
      // Rollback transaction
      await t.rollback();

      // Throw error upwards
      throw err;
    }
  }

  /**
   * Reads publisher request entry from database
   * @param {number} id Id of document to read
   * @returns Publication request as object
   */
  async function read(id) {
    const result = await publisherModel.findByPk(id, {
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

    // Publisher request entries and publisher registry entries are managed at separate endpoints
    if (result !== null && _isPublisherRequestEntry(result)) {
      const {isbnSubRanges, ismnSubRanges, ...formattedResult} = result.toJSON(); // eslint-disable-line no-unused-vars
      return formattedResult;
    }

    throw new ApiError(HttpStatus.NOT_FOUND);
  }

  /**
   * Removes publisher request entry from database.
   * Entry can be removed only if no publisher identifier has been granted and no messages from system has been sent.
   * @param {number} id Id of document to update
   * @returns True if process succeeds, otherwise throws ApiError
   */
  async function remove(id) {
    const t = await sequelize.transaction();
    try {
      const publisherRequest = await publisherModel.findByPk(id, {
        include: [
          {
            association: 'isbnSubRanges',
            attributes: ['id', 'publisherIdentifier']
          },
          {
            association: 'ismnSubRanges',
            attributes: ['id', 'publisherIdentifier']
          }
        ],
        transaction: t
      });

      // Verify publisher request was found and is not associated with subranges
      if (publisherRequest !== null && _isPublisherRequestEntry(publisherRequest)) {
        // Test publisher does not have any associated identifierbatches
        const publisherIdentifierBatches = await identifierBatchModel.findAndCountAll({where: {publisherId: id}});
        if (publisherIdentifierBatches && publisherIdentifierBatches.count !== 0) {
          throw new ApiError(HttpStatus.CONFLICT, 'Publisher is associated with identifier batches, cannot remove');
        }

        // Test publisher does not have any associated messages
        const publisherMessagesCount = await messageIsbnModel.count({where: {publisherId: id}});
        if (publisherMessagesCount !== 0) {
          throw new ApiError(HttpStatus.CONFLICT, 'Publisher is associated with sent messages, cannot remove');
        }

        // De-associate publications from publisher
        await publicationModel.update({publisherId: null}, {where: {publisherId: id}, transaction: t});

        // Delete archive entry
        const archiveEntryRemoveResult = await publisherArchiveRecordsModel.destroy({where: {publisherId: id}, transaction: t});
        if (archiveEntryRemoveResult > 1) {
          throw new ApiError(HttpStatus.CONFLICT, 'Error in removing archive entry of publisher: there are too many archive entries');
        }

        // Delete publisher entry
        await publisherRequest.destroy({transaction: t});

        // Commit transaction
        await t.commit();
        return true;
      }
      throw new ApiError(HttpStatus.NOT_FOUND);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * Updates publisher request entry
   * @param {number} id Id of document to update
   * @param {Object} doc Document containing information to update
   * @param {Object} user User initiating the request
   * @returns Publication request as object
   */
  async function update(id, doc, user) {
    const publisherRequest = await publisherModel.findByPk(id, {
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

    // Verify the request could be found and it is request entry, not publisher registry entry
    if (publisherRequest !== null && _isPublisherRequestEntry(publisherRequest)) {
      const dbDoc = {...doc, modifiedBy: user.id};

      // Remove attributes not allowed to update/overwrite
      /* eslint-disable functional/immutable-data */
      delete dbDoc.confirmation;
      delete dbDoc.activeIdentifierIsbn;
      delete dbDoc.activeIdentifierIsmn;
      delete dbDoc.createdBy;
      /* eslint-enable functional/immutable-data */

      const result = await publisherRequest.update(dbDoc);

      const {isbnSubRanges, ismnSubRanges, ...formattedResult} = result.toJSON(); // eslint-disable-line no-unused-vars
      return formattedResult;
    }

    throw new ApiError(HttpStatus.NOT_FOUND);
  }

  /**
   * Query publisher requests.
   * @param {Objects} quiOpts Query options from UI
   * @returns Object containing results if succeeds, otherwise throws ApiError
   */
  async function query(guiOpts) {
    const searchAttributes = [
      'officialName',
      'otherNames',
      'previousNames',
      'email',
      'additionalInfo'
    ];

    const attributes = ['id', 'officialName', 'email', 'langCode', 'created', 'additionalInfo'];
    const {searchText, limit, offset} = guiOpts;
    const order = [['id', 'DESC']];

    const conditions = searchText ? {[Op.or]: generateQuery(searchAttributes, searchText.trim())} : undefined;

    const result = await publisherModel.findAndCountAll({
      attributes,
      where: {
        [Op.and]: [
          {...conditions},
          {[Op.and]: [
            {'$isbnSubRanges.id$': null},
            {'$ismnSubRanges.id$': null}
          ]}
        ]
      },
      include: [
        {
          association: 'isbnSubRanges',
          attributes: ['id', 'publisherIdentifier'],
          required: false
        },
        {
          association: 'ismnSubRanges',
          attributes: ['id', 'publisherIdentifier'],
          required: false
        }
      ],
      limit,
      offset,
      order,
      subQuery: false, // Note: required for where clause with eagerly loaded associations to work together with limit/offset/order
      distinct: true, // Required for retrieving true count of distinct entries
      col: 'id' // Required for retrieving true count of distinct entries
    });

    // Sanity check: any result may not have any publisher identifier range definitions
    if (result.rows.some(({isbnSubRanges, ismnSubRanges}) => isbnSubRanges.length !== 0 || ismnSubRanges.length !== 0)) {
      throw new ApiError(HttpStatus.CONFLICT, 'ISBN-registry publisher request query function was faulty. Please contact system administrator to resolve the issue.');
    }

    const formattedResults = result.rows
      .map(v => v.toJSON())
      .map(({isbnSubRanges, ismnSubRanges, ...v}) => v); // eslint-disable-line no-unused-vars

    return {totalDoc: result.count, results: formattedResults};
  }

  /**
   * Function to test whether publisherModel entry is joining request to publisher registry.
   * Entry is request to join publisher registry if it has not yet been given isbn publisher range or
   * ismn publisher range.
   * @param {Object} doc publisherModel entry containing isbn/ismn subrange information
   * @returns true if entry is request to join publisher registry, false if not
   */
  function _isPublisherRequestEntry(doc) {
    // Sanity check
    if (!Object.prototype.hasOwnProperty.call(doc, 'isbnSubRanges') || !Object.prototype.hasOwnProperty.call(doc, 'ismnSubRanges')) {
      return false;
    }

    // For raw queries, if attribute is not array, there are no linked entities
    if (!Array.isArray(doc.isbnSubRanges) && !Array.isArray(doc.ismnSubRanges)) {
      return true;
    }

    // For non-raw queries, investigate array length
    if (doc.isbnSubRanges.length === 0 && doc.ismnSubRanges.length === 0) {
      return true;
    }

    return false;
  }

  /**
   * Utility function to genererate archive record out of publisher request
   * @param {Object} doc Document to generate archive record from
   * @param {number} publisherId Publisher request id to link archive record to
   * @returns Archive record as object
   */
  function _generateArchiveRecord(doc, publisherId) {
    return {
      officialName: doc.officialName,
      publisherId,
      otherNames: doc.otherNames,
      address: doc.address,
      zip: doc.zip,
      city: doc.city,
      phone: doc.phone,
      email: doc.email,
      www: doc.www,
      langCode: doc.langCode,
      contactPerson: doc.contactPerson,
      frequencyCurrent: doc.frequencyCurrent,
      frequencyNext: doc.frequencyNext,
      affiliateOf: doc.affiliateOf,
      affiliates: doc.affiliates,
      distributorOf: doc.distributorOf,
      distributors: doc.distributors,
      classification: doc.classification,
      classificationOther: doc.classificationOther,
      confirmation: doc.confirmation,
      createdBy: doc.createdBy
    };
  }
}
