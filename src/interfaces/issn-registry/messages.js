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
import {createLogger} from '@natlibfi/melinda-backend-commons/dist/utils';

import {ISSN_EMAIL, MESSAGE_TYPE_CONFIG_ISSN, NODE_ENV, SEND_EMAILS} from '../../config';

import sequelize from '../../models';
import {ApiError} from '../../utils';
import {generateQuery} from '../interfaceUtils';
import {getIssnPublisherEmail, getTestPrefixedMessageBody, getTestPrefixedSubject, isValidIssnMessageCode, sendEmail, translatePublicationMediumIssn} from '../common/utils/messageUtils';
import abstractModelInterface from '../common/abstractModelInterface';
import {ISSN_REGISTRY_FORM_STATUS} from '../constants';

/**
 * ISSN registry message interface. Contains send, loadTemplate, read and query operations.
 * @returns Interface to interact with ISSN registry messages
 */
export default function () {
  const logger = createLogger();

  const publisherModel = sequelize.models.publisherIssn;
  const publicationIssnModel = sequelize.models.publicationIssn;
  const issnFormModel = sequelize.models.issnForm;
  const messageIssnModel = sequelize.models.messageIssn;
  const messageTypeIssnModel = sequelize.models.messageTypeIssn;
  const messageTemplateIssnModel = sequelize.models.messageTemplateIssn;

  const publisherModelInterface = abstractModelInterface(publisherModel);
  const issnFormModelInterface = abstractModelInterface(issnFormModel);
  const messageIssnModelInterface = abstractModelInterface(messageIssnModel);
  const messageTypeIssnModelInterface = abstractModelInterface(messageTypeIssnModel);
  const messageTemplateIssnModelInterface = abstractModelInterface(messageTemplateIssnModel);

  return {
    send,
    resend,
    loadTemplate,
    read: messageIssnModelInterface.readJSON,
    query
  };

  /**
   * Send email message and save it to database. If action is sending message regarding completion of ISSN request,
   * status of said request is updated to COMPLETED.
   * @param {Object} message Message information
   * @param {Object} user User sending the message
   * @returns Message information saved to db as JSON on success, otherwise throws ApiError
   */
  async function send(message, user) {
    // Start transaction
    const t = await sequelize.transaction();

    try {
      const {
        publisherId,
        formId,
        messageTemplateId,
        langCode,
        recipient,
        subject,
        messageBody
      } = message;

      // Sanity checks: defined items must be findable in db
      const messageTemplate = await messageTemplateIssnModelInterface.read(messageTemplateId);
      const publisher = await publisherModelInterface.read(publisherId);
      const form = formId ? await issnFormModelInterface.read(formId) : null;

      if (publisher && form) {
        // Form must belong to defined publisher
        if (form.publisherId !== publisherId) {
          throw new ApiError(HttpStatus.CONFLICT, 'Form does not belong to defined publisher!');
        }
      }

      // Change status of form to COMPLETED if status is currently NOT_NOTIFIED
      if (form !== null && form.status === ISSN_REGISTRY_FORM_STATUS.NOT_NOTIFIED) {
        await form.update({status: ISSN_REGISTRY_FORM_STATUS.COMPLETED, modifiedBy: user.id}, {transaction: t});
      }

      // Save message to db
      const dbMessage = {
        publisherId,
        formId: formId ? formId : null,
        messageTypeId: messageTemplate.messageTypeId,
        messageTemplateId,
        recipient,
        subject,
        message: messageBody,
        langCode,
        sentBy: user.id
      };

      const result = await messageIssnModelInterface.create(dbMessage, t);

      // Send email since it has been successfully saved to db already
      if (SEND_EMAILS) {
        logger.info('Start sending email message using email service');
        const messageOptions = {
          from: ISSN_EMAIL,
          to: recipient,
          subject,
          html: messageBody
        };

        await sendEmail(messageOptions);
      }

      // Commit transaction
      await t.commit();

      return result.toJSON();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }


  /**
   * Resend a ISSN-registry message that has been sent previously and can be found from database. Email is sent to the address
   * given as parameter instead of original recipient email address. Utilizes send function.
   * @param {number} messageId ID of message to resend
   * @param {Object} messageOptions Options regarding resend, e.g., new recipient of message
   * @param {Object} user User making the request
   * @returns {Object} Message that was send and saved to database as JSON
   */
  async function resend(messageId, messageOptions, user) {
    const {recipient} = messageOptions;
    const originalMessage = await messageIssnModelInterface.read(messageId);

    const message = {
      publisherId: originalMessage.publisherId,
      formId: originalMessage.formId,
      messageTemplateId: originalMessage.messageTemplateId,
      messageTypeId: originalMessage.messageTypeId,
      langCode: originalMessage.langCode,
      recipient, // Note: recipient is NOT from original message
      subject: originalMessage.subject,
      messageBody: originalMessage.message
    };

    // Utilize send functionality to resend message
    return send(message, user);
  }

  /**
   * Generates email message based on parameter information (e.g., template, publisherId, etc.).
   * Does NOT save anything to database.
   * @param {Object} doc Parameters for message generation from messageTemplate
   * @param {Object} user User making the request
   * @returns {Object} message object as JSON that can be displayed in front-end text editor
   */
  /* eslint-disable functional/no-let */
  async function loadTemplate(doc, user) {
    const {code, publisherId, formId} = doc;
    let form;

    // See if message code is valid
    if (!isValidIssnMessageCode(code)) {
      throw new ApiError(HttpStatus.NOT_FOUND, `Unidentified message code: ${code}`);
    }

    // Find message type related to message code from config
    const messageTypeId = MESSAGE_TYPE_CONFIG_ISSN[code];
    await messageTypeIssnModelInterface.read(messageTypeId); // Verifies message type can be found from db

    // Initialize message
    const message = {};

    // Find publisher associated with message
    const publisher = await publisherModelInterface.read(publisherId);

    // Format publisher so that it's easier to manage data
    const messagePublisher = publisher.toJSON();

    // Test whether email considers handled form
    if (code === 'form_handled') {
      form = await issnFormModelInterface.read(formId);

      // Verify publisherId is equal to the one defined as association in form
      if (messagePublisher.id !== form.publisherId) {
        throw new ApiError(HttpStatus.CONFLICT, 'PublisherId given as parameter is different from publisherId related to form');
      }

      message.formId = form.id;
      message.langCode = form.langCode;
      message.recipient = form.email;
    }

    if (code === 'publisher_summary' || !message.recipient) {
      message.langCode = messagePublisher.langCode;
      message.recipient = getIssnPublisherEmail(messagePublisher);
    }

    message.publisherId = messagePublisher.id;

    // Get message template
    const messageTemplates = await messageTemplateIssnModel.findAndCountAll({where: {messageTypeId, langCode: message.langCode}});
    // Check there is only one result
    if (messageTemplates.count === 0) {
      throw new ApiError(HttpStatus.CONFLICT, 'Could not find message template for the type and language of message');
    }

    if (messageTemplates.count > 1) {
      throw new ApiError(HttpStatus.CONFLICT, 'Found too many message templates that correspond to message type and language');
    }

    const messageTemplate = messageTemplates.rows[0];

    message.messageTemplateId = messageTemplate.id;
    message.subject = messageTemplate.subject;
    message.message = messageTemplate.message;

    // Insert publications information if it needs to be inserted
    if (['form_handled', 'publisher_summary'].includes(code)) {

      const publications = code === 'form_handled' ? await getPublicationsByFormId(message.formId) : await getPublicationsByPublisherId(message.publisherId);
      if (!publications || publications.length === 0) {
        throw new ApiError(HttpStatus.CONFLICT, 'Could not find publications to include into message');
      }

      // Title is derived from first title of publications array. Empty value is used if it does not exist.
      const publicationTitle = publications.length > 0 && publications[0].title ? publications[0].title : '';
      message.subject = message.subject.replace('#TITLE#', publicationTitle);
      message.message = message.message.replace('#TITLE#', publicationTitle);
      message.message = addIdentifiers(message.message, publications, message.langCode);
    }

    // Fill in rest of placeholders
    message.message = message.message.replace('#DATE#', new Date().toLocaleDateString('fi-FI'));
    message.message = message.message.replace('#USER#', getUserName(user));
    message.message = message.message.replace('#EMAIL#', message.recipient);
    message.message = message.message.replace('#PUBLISHER#', messagePublisher.officialName);

    const messageAddress = !form || (!form.address || !form.zip || !form.city) ? formatAddress(messagePublisher) : formatAddress(form);
    message.message = message.message.replace('#ADDRESS#', messageAddress);

    const messageContactPerson = !form || !form.contactPerson ? findContact(messagePublisher, message.recipient) : form.contactPerson;
    message.message = message.message.replace('#CONTACT_PERSON#', messageContactPerson);


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
     * Returns the contact person from publisher information that has matching email to second parameter
     * @param {Object} publisher Publisher object
     * @param {string} email Email used to find contact from publisher contact information
     * @returns {string} Contact name defined in publisher contact information
     */
    function findContact(publisher, email) {
      const contactIdx = publisher.contactPerson?.email ? publisher.contactPerson.email.findIndex(v => v === email) : -1;

      if (contactIdx === -1 || publisher.contactPerson?.name.length < contactIdx + 1) {
        return '';
      }

      return publisher.contactPerson.name[contactIdx];
    }

    /**
     * Formats address to fit html message body
     * @param {Object} addressInfo Address information (address, zip, city)
     * @returns {string} Formatted address string
     */
    function formatAddress({address, zip, city}) {
      return `${address}<br />${zip} ${city}`;
    }

    /**
     * Adds Publications and their ISSN identifiers to message html body to place where '#PUBLICATIONS#' definition is found.
     * @param {string} messageBody Message html body in string format
     * @param {Array} publications Array of publications to add to message body
     * @param {string} langCode Language to translate type information to
     * @returns {string} Message html body that includes identifiers in place of '#PUBLICATIONS#'
     */
    function addIdentifiers(messageBody, publications, langCode) {
      const html = publications.map(publication => `${publication.title}<br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ISSN ${publication.issn} (${translatePublicationMediumIssn(publication.medium, langCode)})<br />`)
        .join('<br />');

      return messageBody.replace('#PUBLICATIONS#', html);
    }

    async function getPublicationsByFormId(formId) {
      return publicationIssnModel.findAll({
        where: {
          formId
        }
      });
    }

    async function getPublicationsByPublisherId(publisherId) {
      return publicationIssnModel.findAll({
        where: {
          publisherId
        }
      });
    }
  }
  /* eslint-enable functional/no-let */

  /**
   * Queries ISSN messages
   * @param {number} guiOpts Query parameters
   * @returns {Object} Resulting database entry in JSON format if success. Throws ApiError on failure.
   */
  async function query(guiOpts) {

    const attributes = ['id', 'recipient', 'subject', 'sent'];
    const {publisherId, formId, searchText, offset, limit} = guiOpts;
    const order = [['id', 'DESC']];

    const publisherCondition = publisherId ? {publisherId} : undefined;
    const publicationCondition = formId ? {formId} : undefined;
    const textConditions = searchText ? {[Op.or]: generateQuery(['message', 'recipient'], searchText.trim())} : undefined;

    const result = await messageIssnModel.findAndCountAll({
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
          model: messageTemplateIssnModel,
          as: 'messageTemplateIssn',
          attributes: ['id', 'name']
        }
      ],
      limit,
      offset,
      order
    });

    const formattedResults = result.rows.map(formatResult);
    return {totalDoc: result.count, results: formattedResults};

    function formatResult(message) {
      const {messageTemplateIssn, ...rest} = message.toJSON();
      return {
        ...rest,
        messageTemplateName: messageTemplateIssn.name
      };
    }
  }
}
