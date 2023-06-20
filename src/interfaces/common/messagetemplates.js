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

import sequelize from '../../models';
import {ApiError} from '../../utils';
import {COMMON_REGISTRY_TYPES} from '../constants';
import {MESSAGE_TYPE_CONFIG_ISBN, MESSAGE_TYPE_CONFIG_ISSN} from '../../config';
import abstractInterface from './abstractModelInterface';

/**
 * Abstract message template interface that may be used by many registries. Contains mainly CRUD operations.
 * @param registry Type of registry to interact with (affects database tables)
 * @returns Interface to interact with message templates of chosen registry
 */
export default function (registry) {
  const REGISTRY = registry;

  const {messageTemplateModel, messageTypeModel, messageTypeAssociationName} = getModels(REGISTRY);
  const messageTemplateModelInterface = abstractInterface(messageTemplateModel);
  const messageTypeConfig = getMessageTypeConfig(REGISTRY);

  return {
    create,
    read: messageTemplateModelInterface.readJSON,
    readAll,
    update,
    remove
  };

  /**
   * Get template models to interact with
   * @param {string} registry Type of registry
   * @returns Sequelize model
   */
  function getModels(registry) {
    if (registry === COMMON_REGISTRY_TYPES.ISBN_ISMN) {
      return {
        messageTemplateModel: sequelize.models.messageTemplateIsbn,
        messageTypeModel: sequelize.models.messageTypeIsbn,
        messageTypeAssociationName: 'messageType'
      };
    }

    if (registry === COMMON_REGISTRY_TYPES.ISSN) {
      return {
        messageTemplateModel: sequelize.models.messageTemplateIssn,
        messageTypeModel: sequelize.models.messageTypeIssn,
        messageTypeAssociationName: 'messageTypeIssn'
      };
    }

    throw Error('Invalid registry type. Cannot initialize interface for message types.');
  }

  /**
   * Get message template configuration model for chosen registry
   * @param {string} registry Type of registry
   * @returns Message configuration object
   */
  function getMessageTypeConfig(registry) {
    if (registry === COMMON_REGISTRY_TYPES.ISBN_ISMN) {
      return MESSAGE_TYPE_CONFIG_ISBN;
    }

    if (registry === COMMON_REGISTRY_TYPES.ISSN) {
      return MESSAGE_TYPE_CONFIG_ISSN;
    }

    throw Error('Invalid registry type. Cannot initialize interface for message types.');
  }


  /**
   * Stores message template
   * @param {number} doc Document send as request
   * @param {Object} user User information
   * @returns Resulting database entry in JSON format if success. Throws ApiError on failure.
   */
  async function create(doc, user) { // eslint-disable-line require-await
    const dbDoc = {...doc, createdBy: user.id, modifiedBy: user.id};

    // Require message type definition to be proper
    const messageType = await messageTypeModel.findByPk(doc.messageTypeId);
    if (!doc.messageTypeId || !messageType) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'Cannot find selected message type id from database');
    }

    // Do not allow creating multiple messagetemplates sharing message_type_id and language
    // As loadtemplate will not be able to distinct them
    if (Object.values(messageTypeConfig).includes(dbDoc.messageTypeId)) {
      const templatesCount = await messageTemplateModel.count({
        where: {
          messageTypeId: dbDoc.messageTypeId,
          langCode: dbDoc.langCode
        }
      });

      if (templatesCount > 0) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot create messagetemplate with selected message type and language as it would result into conflict with existing template');
      }
    }

    return messageTemplateModelInterface.create(dbDoc);
  }

  /**
   * Reads all message templates
   * @returns Resulting database entry in JSON format if success. Throws ApiError on failure.
   */
  async function readAll() {
    const result = await messageTemplateModel.findAll({
      attributes: ['id', 'name', 'langCode', 'subject'],
      include: [
        {
          model: messageTypeModel,
          as: messageTypeAssociationName,
          attributes: ['name']
        }
      ]
    });

    const formattedResults = result.map(messageTemplate => {
      const messageTemplateAsJson = messageTemplate.toJSON();
      const result = {...messageTemplateAsJson, messageTypeName: messageTemplate[messageTypeAssociationName].name};
      delete result[messageTypeAssociationName]; // eslint-disable-line functional/immutable-data
      return result;
    });

    return formattedResults;
  }

  /**
   * Updates message template. Message template update is restricted regarding message_type_id field
   * so that if the template is the only one linked to mandatory system action for selected language,
   * the type definition update is disallowed.
   * @param {number} id Id of message template to update
   * @param {Object} doc Values to update to db document (name, description)
   * @param {Object} user User information
   * @returns True on success. Throws ApiError on failure.
   */
  async function update(id, doc, user) {
    const messageTemplate = await messageTemplateModel.findByPk(id);

    if (messageTemplate !== null) {
      // If message template is the only one associated with message type/language that is required in env action mapping
      // Do not allow update the template message_type_id
      if (Object.values(messageTypeConfig).includes(messageTemplate.messageTypeId)) {
        const templatesCount = await messageTemplateModel.count({
          where: {
            messageTypeId: messageTemplate.messageTypeId,
            langCode: messageTemplate.langCode
          }
        });

        if (templatesCount === 1 && doc.messageTypeId && doc.messageTypeId !== messageTemplate.messageTypeId) {
          throw new ApiError(HttpStatus.CONFLICT, 'Cannot update message template type as it is only one linked to a type required for mandatory system action');
        }
      }

      const dbDoc = {
        name: doc.name,
        subject: doc.subject,
        langCode: doc.langCode,
        message: doc.message,
        messageTypeId: doc.messageTypeId,
        modifiedBy: user.id
      };

      const result = await messageTemplateModelInterface.update(id, dbDoc);
      return result.toJSON();
    }

    throw new ApiError(HttpStatus.NOT_FOUND);
  }


  /**
   * Removes message template. Template can only be removed if it's not linked to action in system's message configuration.
   * @param {number} id Id of message template to remove
   * @returns True on success. Throws ApiError on failure.
   */
  async function remove(id) {
    const result = await messageTemplateModel.findByPk(id);

    if (result === null) {
      throw new ApiError(HttpStatus.NOT_FOUND);
    }

    // If message template is the only one associated with message type/language that is required in env action mapping
    // Do not delete the template
    if (Object.values(messageTypeConfig).includes(result.messageTypeId)) {
      const templatesCount = await messageTemplateModel.count({
        where: {
          messageTypeId: result.messageTypeId,
          langCode: result.langCode
        }
      });

      if (templatesCount === 1) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot delete template as it is only one linked to a mandatory system action');
      }
    }

    // Do not delete message template if id is used as FK anywhere
    // Depends on registry which models have associations
    const associatedModels = getAssociationModels(REGISTRY);
    const assocationBooleans = await Promise.all(associatedModels.map(model => hasAssociations(model, id)));

    // If any check produced result that message type has associations, refuse to remove
    if (assocationBooleans.some(v => v)) {
      throw new ApiError(HttpStatus.CONFLICT, 'Cannot delete message template as it has associations to either messages or message types');
    }

    return messageTemplateModelInterface.remove(id);

    /**
     * Get associations regarding message templates
     * @param {string} registry Registry to interact witch
     * @returns Array of sequelize models that contain message_template_id as FK column
     */
    function getAssociationModels(registry) {
      if (registry === COMMON_REGISTRY_TYPES.ISBN_ISMN) {
        return [sequelize.models.messageIsbn];
      }

      if (registry === COMMON_REGISTRY_TYPES.ISSN) {
        return [sequelize.models.messageIssn];
      }

      throw Error('Invalid registry type. Cannot initialize interface for message types.');
    }

    /**
     * Utility function for defining whether the message template id has associations regarding the model given as input
     * @param {Object} model Sequelize model
     * @param {number} messageTemplateId Message template id to check associations for
     * @returns True if there are existing FK associations that can be found using the sequelize model, otherwise false
     */
    async function hasAssociations(model, messageTemplateId) {
      const numberOfAssociations = await model.count({where: {messageTemplateId}});
      return numberOfAssociations > 0;
    }
  }
}
