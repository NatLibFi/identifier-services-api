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
import {generateQuery} from '../../interfaceUtils';
import {ISBN_EMAIL, NODE_ENV, SEND_EMAILS, WEBSITE_USER} from '../../../config';
import {ISBN_REGISTRY_FORMATS} from '../../constants';
import {getTestPrefixedMessageBody, getTestPrefixedSubject, sendEmail} from '../../common/utils/messageUtils';
import abstractModelInterface from '../../common/abstractModelInterface';

/**
 * ISBN-registry publication request interface. Contains CRUD operations and a number of helper functions.
 * @returns Interface to interact with ISBN publication requests
 */
export default function () {
  const logger = createLogger();

  const identifierBatchModel = sequelize.models.identifierBatch;
  const publicationModel = sequelize.models.publicationIsbn;
  const publisherModel = sequelize.models.publisherIsbn;

  const publicationModelInterface = abstractModelInterface(publicationModel);
  const publisherModelInterface = abstractModelInterface(publisherModel);

  return {
    create,
    read,
    update,
    remove,
    query,
    setPublisher,
    copy
  };

  /**
   * Creates ISBN-registry publication request entry to database
   * @param {Object} doc Request information document
   * @param {Object} user User initiating the request
   * @param {boolean} copy Whether the creation was due to making a copy and email should not be sent
   * @returns Created resource as object
   */
  async function create(doc, user, copy = false) {
    const dbDoc = {
      ...doc,
      createdBy: user ? user.id : WEBSITE_USER,
      modifiedBy: user ? user.id : WEBSITE_USER
    };

    // One type definition is required
    if (!dbDoc.type && !dbDoc.fileformat) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'Publication request requires at least 1 type/fileformat');
    }

    // Type definitions need to be sane
    _publicationFormatSanityCheck(dbDoc);

    const result = await publicationModelInterface.create(dbDoc);

    // Inform customer that the request was successfully received if system is configured to send emails
    // If logged in user is initiating the creation of request, do not send confirmation email
    /* eslint-disable no-process-env,functional/no-let,functional/no-conditional-statements */
    if (!user && SEND_EMAILS && !copy) {
      let messageBody = 'ISBN-/ISMN-hakulomakkeenne on vastaanotettu. Lomakkeet käsitellään saapumisjärjestyksessä.<br /><br />Ystävällisin terveisin,<br />ISBN-keskus';
      let subject = 'ISBN-/ISMN-hakulomakkeenne on vastaanotettu';
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
        logger.error('Encountered error when attempting to send ISBN request confirmation email using nodemailer.');
      }
    }

    /* eslint-enable no-process-env,functional/no-let,functional/no-conditional-statements */
    return result.toJSON();
  }

  /**
   * Reads publication request entry from database
   * @param {number} id Id of document to read
   * @returns Publication request as object
   */
  async function read(id) {
    const result = await publicationModel.findByPk(id, {include: [
      {
        association: 'publisher',
        attributes: ['id', 'officialName']
      }
    ]});

    // Include identifierBatch information to response so that loadTemplate functionality may be utilized
    const identifierBatches = await identifierBatchModel.findAll({where: {publicationId: id}});

    // If publication has multiple identifierBatch, it is a problem that needs to be resolved. Throw an error.
    if (identifierBatches.length > 1) {
      throw new ApiError(HttpStatus.CONFLICT, 'Publication request has multiple identifier batches. Please contact identifier system administrator if you see this message.');
    }

    const identifierBatch = identifierBatches.length === 0 ? null : identifierBatches[0];

    // Sanity check: Identifier batch publisherId must match publisher id of publication.
    if (identifierBatch && identifierBatch.publisherId !== result.publisherId) {
      throw new ApiError(HttpStatus.CONFLICT, 'Publication\'s and its identifierbatches publisherId does not match. Please contact identifier system administrator if you see this message.');
    }

    // Do not include publisher object, but instead implement new virtual attribute publisherName
    const {publisher, ...formattedResult} = result.toJSON();
    formattedResult.publisherName = publisher ? publisher.officialName : null; // eslint-disable-line functional/immutable-data

    return {
      identifierBatchId: identifierBatch ? identifierBatch.id : null,
      ...formattedResult
    };
  }

  /**
   * Updates publication request entry
   * @param {number} id Id of document to update
   * @param {Object} doc Document containing information to update
   * @param {Object} user User initiating the request
   * @returns Publication request as object
   */
  /* eslint-disable max-statements,max-depth */
  async function update(id, doc, user) {
    // Interfaces between old schema and noSQL-like schema
    const publication = await publicationModelInterface.read(id);
    const dbDoc = {...doc, modifiedBy: user.id};

    // Test whether request have been accepted as this affect what attributes can be updated
    // eslint-disable-next-line functional/no-conditional-statements
    if (_getState(publication) === 'ACCEPTED') {
      /* eslint-disable functional/immutable-data */
      if (doc.noIdentifierGranted || doc.onProcess === true) {
        throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'Cannot alter state of publication request after identifiers have been granted');
      }

      // Cannot change publication type after identifiers have already been assigned to publication
      if (doc.publicationType && doc.publicationType !== publication.publicationType) {
        throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'Cannot change publication\'s publication type after identifiers have been granted');
      }

      // Wont allow type updates after request have been accepted
      if (doc.type && JSON.stringify(doc.type) !== JSON.stringify(publication.type)) {
        throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'Cannot change publication\'s type information after identifiers have been granted');
      }

      // Wont allow fileformat updates after request have been accepted
      if (doc.fileformat && JSON.stringify(doc.fileformat) !== JSON.stringify(publication.fileformat)) {
        throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'Cannot change publication\'s fileformat information after identifiers have been granted');
      }

      // Even if the values of type and fileformat are equal, they are deleted
      // checks consider only that we wish to explicitly display the error
      delete dbDoc.type;
      delete dbDoc.fileformat;
    }

    // If request has state NEW when it's updated, automatically update request state to IN_PROGRESS
    if (_getState(publication) === 'NEW') { // eslint-disable-line
      dbDoc.onProcess = true;
    }

    // Remove attributes that are not allowed to update through update functionality
    delete dbDoc.publicationIdentifierPrint;
    delete dbDoc.publicationIdentifierElectronical;
    delete dbDoc.publicationIdentifierType;
    delete dbDoc.createdBy;
    delete dbDoc.created;
    delete dbDoc.modified;
    /* eslint-enable functional/immutable-data */

    // Format sanity check, produces error if does not pass
    _publicationFormatSanityCheck(dbDoc);

    // Author information completeness check, produces error if does not pass
    _authorInformationSanityCheck(dbDoc);

    // Update publicatino to db
    await publication.update(dbDoc);
    return read(id);
  }
  /* eslint-enable max-statements,max-depth */

  /**
   * Removes publication request entry from database. Entry can be removed only if no identifier has been granted.
   * @param {number} id Id of document to update
   * @returns True if process succeeds, otherwise throws ApiError
   */
  async function remove(id) {
    const publication = await publicationModelInterface.read(id);
    const publicationIdentifierBatches = await identifierBatchModel.findAndCountAll({where: {publicationId: id}});

    // If there exist identifier batches linked to publication, do not allow removal of request entity
    if (!publicationIdentifierBatches) {
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Problem occurred while retrieving information regarding publication identifiers from database');
    }

    // If there exist identifier information in publication, do not allow removal of request entity
    if (publication.publicationIdentifierPrint || publication.publicationIdentifierElectronical || publicationIdentifierBatches.count > 0) {
      throw new ApiError(HttpStatus.CONFLICT, 'Cannot delete publication requests which already has identifier assigned');
    }

    // Final test: Publication can be deleted only if no identifier granted is true
    // This confirms the decision has actively been made
    if (!publication.noIdentifierGranted) {
      throw new ApiError(HttpStatus.CONFLICT, 'Cannot delete publication requests which has not been given "no identifier granted" property');
    }

    // Delete item from db
    await publication.destroy();
    return true;
  }

  /**
   * Query publication requests.
   * @param {Objects} quiOpts Query options from UI
   * @returns Object containing results if succeeds, otherwise throws ApiError
   */
  async function query(guiOpts) {
    const attributes = ['id', 'title', 'officialName', 'langCode', 'publicationType', 'comments'];
    const {offset, limit, searchText, state} = guiOpts;
    const order = [['id', 'DESC']];
    const trimmedSearchText = searchText ? searchText.trim() : undefined;

    const stateConditions = state ? _getConditionsByState(state) : undefined;

    const result = !trimmedSearchText || trimmedSearchText.match(/^97(?:8|9)-(?:951|952|0)-\d+/u) === null
      ? await searchByAttributes(guiOpts, stateConditions)
      : await searchByIdentifier(trimmedSearchText, stateConditions);

    return {totalDoc: result.count, results: result.rows.map(r => r.toJSON())};

    // eslint-disable-next-line require-await
    async function searchByAttributes(attr, stateConditions) {
      const {publisherId, searchText} = attr;
      const searchAttributes = ['officialName', 'contactPerson', 'email', 'comments', 'title', 'subtitle'];

      const publisherCondition = publisherId ? {publisherId} : undefined;
      const textConditions = searchText ? {[Op.or]: generateQuery(searchAttributes, searchText.trim())} : undefined;

      return publicationModel.findAndCountAll({
        attributes,
        where: {
          [Op.and]: [
            publisherCondition,
            textConditions,
            stateConditions
          ]
        },
        offset,
        limit,
        order
      });
    }

    // eslint-disable-next-line require-await
    async function searchByIdentifier(identifier, stateConditions) {
      const identifierSearchTerm = `%${identifier}%`;
      return publicationModel.findAndCountAll({
        attributes,
        where: {
          [Op.and]: [
            {
              [Op.or]: [
                {publicationIdentifierPrint: {[Op.like]: identifierSearchTerm}},
                {publicationIdentifierElectronical: {[Op.like]: identifierSearchTerm}}
              ]
            },
            stateConditions
          ]
        },
        offset,
        limit,
        order
      });
    }
  }

  /**
   * Copy publication request. Request can be copied only if no identifier has been yet given to publication.
   * Utilizes interfaces create function in creating the copy.
   * @param {number} id Request to copy
   * @param {Object} user User initiating the copy process
   * @returns Newly created publication request object
   */
  async function copy(id, user) {
    const readResult = await publicationModelInterface.read(id);

    // Copy is allowed only if no identifiers have been given
    if (readResult.publicationIdentifierPrint || readResult.publicationIdentifierElectronical) {
      throw new ApiError(HttpStatus.CONFLICT, 'Cannot create copy of publicationRequest which has identifiers already assigned');
    }

    // Some attributes should not be copied ever, e.g., identifiers and request metadata information
    /* eslint-disable no-unused-vars*/
    const {
      id: _id,
      publicationIdentifierPrint,
      publicationIdentifierElectronical,
      publicationIdentifierType,
      noIdentifierGranted,
      onProcess,
      created,
      createdBy,
      modified,
      modifiedBy,
      ...dbDoc
    } = readResult.toJSON();
    /* eslint-enable no-unused-vars*/

    // Add copy information to title
    dbDoc.title = `${dbDoc.title} (copy)`; // eslint-disable-line functional/immutable-data

    return create(dbDoc, user, true);
  }

  /**
   * Set publisher to publication request. If request has state of NEW, transfer state to IN_PROCESS.
   * @param {number} id Publication request id to set publisher for
   * @param {number} publisherId Publisher id to set for publication request
   * @param {Object} user User initiating the copy process
   * @returns Updated publication request object
   */
  async function setPublisher(id, publisherId, user) {
    const publication = await publicationModelInterface.read(id);

    // Verifies publisher can be found from database if the publisherId is not null
    publisherId === null || await publisherModelInterface.read(publisherId); // eslint-disable-line no-unused-expressions

    if (_getState(publication) === 'ACCEPTED') {
      throw new ApiError(HttpStatus.CONFLICT, 'Cannot set publisher to publication which already has assigned identifiers!');
    }

    const updateDoc = {
      publisherId,
      modifiedBy: user.id
    };

    // eslint-disable-next-line functional/no-conditional-statements
    if (_getState(publication) === 'NEW') {
      updateDoc.onProcess = true; // eslint-disable-line functional/immutable-data
    }

    await publication.update(updateDoc);
    return read(id);
  }

  /**
   * Returns state of publication request based on its attributes
   * @param {Object} publication Publication request
   * @returns State in string format
   */
  function _getState(publication) {
    if (publication.publicationIdentifierPrint === '' && publication.publicationIdentifierElectronical === '') {
      if (!publication.onProcess && !publication.noIdentifierGranted) {
        return 'NEW';
      }

      if (publication.onProcess && !publication.noIdentifierGranted) {
        return 'IN_PROCESS';
      }
    }

    // eslint-disable-next-line no-extra-parens
    if (((publication.publicationIdentifierPrint !== '' || publication.publicationIdentifierElectronical !== '')) && !publication.noIdentifierGranted) {
      return 'ACCEPTED';
    }

    if (publication.noIdentifierGranted) {
      return 'REJECTED';
    }

    throw new Error('Publication has unknown state');
  }

  /**
  * Returns object containing sequelize query conditions based on publication state given as parameter
  * @param {string} state State
  * @returns Object containing sequelize query parameters
  */
  function _getConditionsByState(state) {
    if (!state || state === '') {
      return {};
    }

    if (state === 'NEW') {
      return {
        publicationIdentifierPrint: '',
        publicationIdentifierElectronical: '',
        onProcess: false,
        noIdentifierGranted: false
      };
    }

    if (state === 'IN_PROCESS') {
      return {
        publicationIdentifierPrint: '',
        publicationIdentifierElectronical: '',
        onProcess: true,
        noIdentifierGranted: false
      };
    }

    if (state === 'ACCEPTED') {
      return {
        [Op.or]: [
          {publicationIdentifierPrint: {[Op.ne]: ''}},
          {publicationIdentifierElectronical: {[Op.ne]: ''}}
        ]
      };
    }

    if (state === 'REJECTED') {
      return {
        noIdentifierGranted: true
      };
    }

    throw new Error('Unknown state was passed to get conditions function of publication interface');
  }

  /**
   * Verifies that publication format definition makes sense together with type and fileformat definitions
   * @param {Object} doc publicationRequest document
   * @returns true if definitions are sane or request have been accepted, throws ApiError otherwise
   */
  function _publicationFormatSanityCheck(doc) {
    // If doc is already accepted, sanity check does not matter as these values are not allowed for update
    if (doc.publicationIdentifierElectronical || doc.publicationIdentifierPrint) {
      return true;
    }


    // If format is print, allow only type attribute
    if (doc.publicationFormat === ISBN_REGISTRY_FORMATS.PRINT && (doc.fileformat && doc.fileformat.length > 0)) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'Fileformat cannot be defined if publication is of PRINT format');
    }

    // If format is electronical, allow only fileformat attribute
    if (doc.publicationFormat === ISBN_REGISTRY_FORMATS.ELECTRONICAL && (doc.type && doc.type.length > 0)) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'Type cannot be defined if publication is of ELECTRONICAL format');
    }

    // If format is print electronical, require both types of attribute (type, fileformat)
    if (doc.publicationFormat === ISBN_REGISTRY_FORMATS.PRINT_ELECTRONICAL && (!doc.fileformat || !doc.type)) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'For publications with format PRINT_ELECTRONICAL, both type and fileformat are required');
    }

    return true;
  }

  /**
   * Verifies that author information entered for authors is complete
   * @param {Object} doc publicationRequest document
   * @returns true if author information is complete for defined authors, throws ApiError otherwise
   */
  function _authorInformationSanityCheck(doc) {
    [1, 2, 3, 4].forEach(authorIndex => {
      const firstName = doc[`firstName${authorIndex}`];
      const lastName = doc[`lastName${authorIndex}`];
      const roles = doc[`role${authorIndex}`];

      if (firstName || lastName || (roles && roles.length > 0)) { // eslint-disable-line
        if (!firstName || !lastName || (!roles || roles.length === 0)) { // eslint-disable-line
          throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, `Disallowing update because author ${authorIndex} has incomplete information`);
        }
      }
    });

    return true;
  }
}
