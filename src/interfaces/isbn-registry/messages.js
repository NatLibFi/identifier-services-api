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
import {Op} from 'sequelize';
import {createLogger} from '@natlibfi/melinda-backend-commons';

import {AUTHOR_PUBLISHER_ID_ISBN, ISBN_EMAIL, MESSAGE_TYPE_CONFIG_ISBN, NODE_ENV, SEND_EMAILS, UI_URL} from '../../config';

import sequelize from '../../models';
import {ApiError} from '../../utils';
import {generateQuery} from '../interfaceUtils';
import {getTestPrefixedMessageBody, getTestPrefixedSubject, isValidIsbnMessageCode, sendEmail, translatePublicationTypeIsbn} from '../common/utils/messageUtils';
import abstractModelInterface from '../common/abstractModelInterface';

/**
 * ISBN-registry message interface. Contains send, loadTemplate, read and query operations.
 * @returns Interface to interact with ISBN-registry messages
 */
export default function () {
  const logger = createLogger();

  const publisherModel = sequelize.models.publisherIsbn;
  const publicationModel = sequelize.models.publicationIsbn;
  const messageIsbnModel = sequelize.models.messageIsbn;
  const messageTypeIsbnModel = sequelize.models.messageTypeIsbn;
  const messageTemplateModel = sequelize.models.messageTemplateIsbn;
  const isbnSubRangeModel = sequelize.models.isbnSubRange;
  const ismnSubRangeModel = sequelize.models.ismnSubRange;
  const identifierBatchModel = sequelize.models.identifierBatch;
  const identifierModel = sequelize.models.identifier;

  const publisherModelInterface = abstractModelInterface(publisherModel);
  const publicationModelInterface = abstractModelInterface(publicationModel);
  const messageIsbnModelInterface = abstractModelInterface(messageIsbnModel);
  const messageTypeIsbnModelInterface = abstractModelInterface(messageTypeIsbnModel);
  const messageTemplateModelInterface = abstractModelInterface(messageTemplateModel);
  const identifierBatchModelInterface = abstractModelInterface(identifierBatchModel);

  return {
    send,
    resend,
    loadTemplate,
    read: messageIsbnModelInterface.readJSON,
    query
  };

  /**
   * Send email message and save it to database
   * @param {Object} message Message information
   * @param {Object} user User sending the message
   * @returns {Object} Message information saved to db as JSON
   */
  /* eslint-disable complexity,max-statements,max-depth */
  /* eslint-disable functional/immutable-data,functional/no-let,functional/no-conditional-statements */
  async function send(message, user) {

    const {
      publisherId,
      publicationId,
      messageTemplateId,
      batchId,
      langCode,
      recipient,
      subject,
      messageBody
    } = message;

    // Sanity checks: defined items must be findable in db
    // Message template is mandatory parameter
    const messageTemplate = await messageTemplateModelInterface.read(messageTemplateId);

    // Publisher is mandatory parameter
    const publisher = await publisherModelInterface.read(publisherId);

    // Publication is non-mandatory parameter
    if (publicationId) {
      const publication = await publicationModelInterface.read(publicationId);

      // Publication must belong to defined publisher
      if (publication.publisherId !== publisher.id) {
        throw new ApiError(HttpStatus.CONFLICT, 'Conflict in publisher/publication definition: publication does not belong to publisher!');
      }
    }

    // Batch is non-mandatory parameter
    if (batchId) {
      const identifierBatch = await identifierBatchModelInterface.read(batchId);

      // Identifier batch must belong to defined publisher
      if (identifierBatch.publisherId !== publisher.id) {
        throw new ApiError(HttpStatus.CONFLICT, 'Conflict in publisher/identifierBatch definition: batch does not belong to publisher!');
      }
    }

    // Save message to db
    const dbMessage = {
      publisherId,
      batchId,
      publicationId,
      messageTypeId: messageTemplate.messageTypeId,
      messageTemplateId,
      groupMessageId: 0,
      recipient,
      subject,
      message: messageBody,
      langCode,
      sentBy: user.id
    };

    const result = await messageIsbnModelInterface.create(dbMessage);

    // Send email since it has been successfully saved to db already
    if (SEND_EMAILS) {
      logger.info('Start sending email message using email service connected to API system');
      const messageOptions = {
        from: ISBN_EMAIL,
        to: recipient,
        subject,
        html: messageBody
      };

      await sendEmail(messageOptions);
      logger.info('Email message has been sent using email service connected to API system');
    }

    // Process completed successfully. Return the message entity saved to database.
    return result.toJSON();
  }
  /* eslint-enable max-statements,max-depth */
  /* eslint-enable functional/immutable-data,functional/no-let,functional/no-conditional-statements */

  /**
   * Resend a ISBN-registry message that has been sent previously and can be found from database. Email is sent to the address
   * given as parameter instead of original recipient email address. Utilizes send function.
   * @param {number} messageId ID of message to resend
   * @param {Object} messageOptions Options regarding resend, e.g., new recipient of message
   * @param {Object} user User making the request
   * @returns {Object} Message that was send and saved to database as JSON
   */
  /* eslint-disable max-depth,max-statements,functional/immutable-data,functional/no-let,functional/no-conditional-statements */
  async function resend(messageId, messageOptions, user) {

    const {recipient} = messageOptions;
    const originalMessage = await messageIsbnModelInterface.read(messageId);

    // Cannot resend messages with attachments as identifier batch information should be send through
    // reinvoking loadTemplate for this will generate the URL needed for access
    if (originalMessage.hasAttachment) {
      throw new ApiError(HttpStatus.CONFLICT, 'Cannot resend old emails containing attachment information');
    }

    const message = {
      publisherId: originalMessage.publisherId,
      publicationId: originalMessage.publicationId ? originalMessage.publicationId : null,
      messageTemplateId: originalMessage.messageTemplateId,
      batchId: originalMessage.batchId ? originalMessage.batchId : null,
      langCode: originalMessage.langCode,
      recipient, // Note: recipient is NOT from original message
      subject: originalMessage.subject,
      messageBody: originalMessage.message
    };

    return send(message, user);
  }
  /* eslint-enable max-depth,max-statements,functional/immutable-data,functional/no-let,functional/no-conditional-statements */

  /**
   * Generates email message based on parameter information (e.g., template, publisherId, etc.).
   * This is done so that the formed message can be edited in GUI before sending. Does NOT save anything to database.
   * @param {Object} doc Document containing the information required for loading template
   * @param {Object} user User initiating the request
   * @returns {Object} Object containing message loaded from a template
   */
  /* eslint-disable max-params,max-statements,max-depth,complexity,prefer-destructuring */
  /* eslint-disable functional/immutable-data,functional/no-let,functional/no-conditional-statements */
  async function loadTemplate(doc, user) {
    const {code, publisherId, publicationId, identifierBatchId} = doc;

    // See if message code is valid
    if (!isValidIsbnMessageCode(code)) {
      throw new ApiError(HttpStatus.NOT_FOUND, `Unidentified message code: ${code}`);
    }

    // Find message type related to message code from config
    const messageTypeId = MESSAGE_TYPE_CONFIG_ISBN[code];
    await messageTypeIsbnModelInterface.read(messageTypeId); // Verifies the messageType can be found from database

    // Find publisher associated with message
    const publisher = await publisherModelInterface.read(publisherId);

    // Initialize message publisher info, this is NOT saved/updated to db
    const messagePublisher = publisher.toJSON();

    // Initialize message
    const message = {};
    let title = '';
    let subtitle = '';

    // Set information to message that already has been gathered
    message.publisherId = publisher.id;
    message.langCode = publisher.langCode;
    message.recipient = publisher.email;

    // Test if message is linked to publication
    // Message relates to publication is code resembles type 'message_type_identifier_created_'
    if ((/identifier_created_(?:isbn|ismn)/u).test(code)) {

      // Find publication assoaciated with message
      const publication = await publicationModelInterface.read(publicationId);

      // Sanity check: publication must belong to publisher
      if (publication.publisherId !== publisher.id) {
        throw new ApiError(HttpStatus.CONFLICT, 'Selected publication does not belong to chosen publisher');
      }

      // Set message publication value and update language selection
      message.publicationId = publication.id;
      message.langCode = publication.langCode;
      title = publication.title;
      subtitle = publication.subtitle;

      // Test if publisher is author publisher. If publisher is author publisher, publisher's name and address must be read from
      // publication request instead of publisher information
      if (publisher.id === AUTHOR_PUBLISHER_ID_ISBN) {

        // Set messagePublisher information
        messagePublisher.officialName = publication.officialName;
        messagePublisher.address = publication.address;
        messagePublisher.zip = publication.zip;
        messagePublisher.city = publication.city;

        // Set recipient
        message.recipient = publication.email;
      } else if (publication.email !== '') {

        // Update email as it is marked as primary email address concerning the publication
        message.recipient = publication.email;
      }
    }

    // Find message template
    const templates = await messageTemplateModel.findAll({
      where: {
        messageTypeId,
        langCode: message.langCode
      }
    });

    if (!templates || templates.length === 0) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Cannot find message template from database that would be associated with message type and language');
    }

    // If there are more than one template associated with message type, cannot decide what template to use.
    // Configuration error must be resolved in this case.
    if (templates.length > 1) {
      throw new ApiError(HttpStatus.CONFLICT, 'Two or more message templates have same language and message type');
    }

    const template = templates[0].toJSON();

    message.templateId = template.id;
    message.subject = template.subject.replace('#TITLE#', title);
    message.message = template.message;

    // Test whether publication identifiers need to be added to message
    const addPublicationIdentifiers = messageRequiresIdentifiers(code);

    // Check whether publisher identifier has been added to message
    let publisherIdentifierAdded = false;

    // Load publisher identifier
    // Check whether code concerns isbn or ismn and select model based on it
    // Note: type variable is utilized later also
    const type = code.endsWith('isbn') ? 'isbn' : 'ismn';
    const subRangeModel = type === 'isbn' ? isbnSubRangeModel : ismnSubRangeModel;

    // Find active subrange (ISBN/ISMN depending on type definition)
    const subRanges = await subRangeModel.findAll({
      where: {
        publisherId,
        isActive: {
          [Op.eq]: true
        }
      }
    });

    if (subRanges && subRanges.length > 0) {
      if (subRanges.length > 1) {
        throw new ApiError(HttpStatus.CONFLICT, 'Publisher has too many active subranges, cannot decide upon subrange.');
      }


      // Add publisher identifier
      message.message = message.message.replace('#IDENTIFIER#', subRanges[0].publisherIdentifier);
      publisherIdentifierAdded = true;
    } else if (addPublicationIdentifiers) {

      // Publisher's subrange may have been closed after identifier generation which results into publisher not necessarily having
      // active identifier. Try finding publisher identifier through using identifier batch.
      // Find identifier batch associated with message
      const identifierBatch = await identifierBatchModelInterface.read(identifierBatchId);

      // Sanity check, identifier batch must belong to publisher
      if (identifierBatch.publisherId !== publisher.id) {
        throw new ApiError(HttpStatus.CONFLICT, 'Selected identifier batch does not belong to chosen publisher');
      }

      if (identifierBatch.subRangeId && identifierBatch.subRangeId > 0) {
        const subRange = await subRangeModel.findByPk(identifierBatch.subRangeId);

        if (subRange) {
          // Set publisher identifier to message
          message.message = message.message.replace('#IDENTIFIER#', subRange.publisherIdentifier);
          publisherIdentifierAdded = true;
        }
      }
    }

    // Add identifiers if needed
    if (addPublicationIdentifiers) {

      // Find identifier batch associated with message (prior control flow does not necessary reach this point)
      const identifierBatch = await identifierBatchModelInterface.read(identifierBatchId);

      // Sanity check, identifier batch must belong to publisher
      if (identifierBatch.publisherId !== publisher.id) {
        throw new ApiError(HttpStatus.CONFLICT, 'Selected identifier batch does not belong to chosen publisher');
      }

      // Find identifiers associated with identifier batch
      const identifiers = await identifierModel.findAll({where: {identifierBatchId}});
      if (!identifiers || identifiers.length === 0) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Could not find Identifiers using batch id given as parameter');
      }

      // See whether URL should be used instead of attaching identifiers to the message
      // URL is used only when sending a list of identifiers to publisher
      const useLink = (/big_publisher_(?:isbn|ismn)/u).test(code);

      // Set message variables, alter message body with identifiers
      message.batchId = identifierBatchId;
      message.message = useLink ? message.message.replaceAll('#IDENTIFIERS#', `${UI_URL}/isbn-registry/identifierbatches/${identifierBatchId}`) : addIdentifiers(message.message, identifiers, type, message.langCode);

      publisherIdentifierAdded = true;
    }

    if (!publisherIdentifierAdded) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Could not find any identifiers');
    }

    // Replace placeholders from message body
    message.message = message.message.replace('#DATE#', new Date().toLocaleDateString('fi-FI'));
    message.message = message.message.replace('#USER#', getUserName(user));
    message.message = message.message.replace('#EMAIL#', message.recipient);
    message.message = message.message.replace('#PUBLISHER#', messagePublisher.officialName);
    message.message = message.message.replace('#ADDRESS#', `${messagePublisher.address}<br />${messagePublisher.zip} ${messagePublisher.city}`);
    message.message = message.message.replace('#TITLE#', title);
    message.message = subtitle ? message.message.replace('#SUBTITLE#', subtitle) : message.message.replace('#SUBTITLE#', '');


    if (NODE_ENV === 'production') {
      return message;
    }

    // Prefix test prefix to message body and subject
    message.message = getTestPrefixedMessageBody(message.message);
    message.subject = getTestPrefixedSubject(message.subject);

    return message;

    function getUserName(user) {
      return user?.name ?? '';
    }

    /**
     * Adds identifiers to message html body to place where '#IDENTIFIERS#' definition is found.
     * @param {string} messageBody Message html body in string format
     * @param {Array} identifiers Array of identifiers to add to message body
     * @param {string} type Type of identifiers to be added to message body
     * @param {string} langCode Language to translate type information to
     * @returns {string} Message html body that includes identifiers in place of '#IDENTIFIERS#'
     */
    function addIdentifiers(messageBody, identifiers, type, langCode) {
      const html = identifiers.map(v => v.publicationType === ''
        ? `${type.toUpperCase()} ${v.identifier}`
        : `${type.toUpperCase()} ${v.identifier} (${translatePublicationTypeIsbn(v.publicationType, langCode)})`)
        .join('<br />');


      return messageBody.replace('#IDENTIFIERS#', html);
    }

    /**
     * Evaluates whether identifiers are required in the message or not
     * @param {string} code Message process code
     * @returns {boolean} True if message requires identifiers to be added to message, otherwise false
     */
    function messageRequiresIdentifiers(code) {
      if (code === 'publisher_registered_isbn' || code === 'publisher_registered_ismn') {
        return false;
      }
      return true;
    }
  }
  /* eslint-enable max-params,max-statements,complexity,prefer-destructuring*/
  /* eslint-enable functional/immutable-data,functional/no-let,functional/no-conditional-statements */

  /**
   * Queries ISBN messages
   * @param {number} guiOpts Query parameters
   * @param {Object} user User information
   * @returns Resulting database search result in JSON format if success, throws ApiError on failure.
   */
  async function query(guiOpts) {

    const attributes = ['id', 'recipient', 'subject', 'sent'];
    const {publisherId, publicationId, searchText, offset, limit} = guiOpts;
    const order = [['id', 'DESC']];
    const publisherCondition = publisherId ? {publisherId} : undefined;
    const publicationCondition = publicationId ? {publicationId} : undefined;
    const textConditions = searchText ? {[Op.or]: generateQuery(['message', 'recipient'], searchText.trim())} : undefined;

    const result = await messageIsbnModel.findAndCountAll({
      attributes,
      where: {
        [Op.and]: [
          publisherCondition,
          publicationCondition,
          textConditions
        ]
      },
      include: [
        {
          model: messageTemplateModel,
          as: 'messageTemplate',
          attributes: ['id', 'name']
        }
      ],
      offset,
      limit,
      order
    });

    const formattedResults = result.rows.map(formatResult);
    return {totalDoc: result.count, results: formattedResults};

    function formatResult(message) {
      const {messageTemplate, ...rest} = message.toJSON();
      return {
        ...rest,
        messageTemplateName: messageTemplate.name
      };
    }
  }
}
