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
 * Abstract message type interface that may be used by many registries. Contains mainly CRUD operations.
 * @param registry Type of registry to interact with (affects database tables)
 * @returns Interface to interact with message types of chosen registry
 */
export default function (registry) {
  const REGISTRY = registry;

  const messageTypeModel = getModel(REGISTRY);
  const messageTypeModelInterface = abstractInterface(messageTypeModel);
  const messageTypeConfig = getMessageTypeConfig(REGISTRY);

  return {
    create,
    read: messageTypeModelInterface.readJSON,
    readAll,
    update,
    remove
  };

  /**
   * Get message type model to interact with
   * @param {string} registry Type of registry
   * @returns Sequelize model
   */
  function getModel(registry) {
    if (registry === COMMON_REGISTRY_TYPES.ISBN_ISMN) {
      return sequelize.models.messageTypeIsbn;
    }

    if (registry === COMMON_REGISTRY_TYPES.ISSN) {
      return sequelize.models.messageTypeIssn;
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
   * Stores message type
   * @param {number} doc Document send as request
   * @param {Object} user User information
   * @returns Resulting database entry in JSON format if success. Throws ApiError on failure.
   */
  async function create(doc, user) {
    const dbDoc = {...doc, createdBy: user.id, modifiedBy: user.id};
    return messageTypeModelInterface.create(dbDoc);
  }

  /**
   * Reads all message types
   * @returns Resulting database entry in JSON format if success. Throws ApiError on failure.
   */
  async function readAll() {
    const result = await messageTypeModel.findAll({attributes: ['id', 'name']});

    return result.map(messageType => messageType.toJSON());
  }

  /**
   * Updates message type
   * @param {number} id Id of message type to update
   * @param {Object} doc Values to update to db document (name, description)
   * @param {Object} user User information
   * @returns True on success. Throws ApiError on failure.
   */
  async function update(id, doc, user) {
    const dbDoc = {name: doc.name, description: doc.description, modifiedBy: user.id};
    const result = await messageTypeModelInterface.update(id, dbDoc);
    return result.toJSON();
  }


  /**
   * Removes message type. Message type can be only removed if it's not linked to action in system's message configuration
   * and does not have any associated entity in the database.
   * @param {number} id Id of message type to remove
   * @returns True on success. Throws ApiError if message type is actively used by system.
   */
  async function remove(id) {
    const result = await messageTypeModel.findByPk(id);

    if (result === null) {
      throw new ApiError(HttpStatus.NOT_FOUND);
    }

    // Do not delete message type if it's defined in the environment as mandatory type regarding message actions
    if (Object.values(messageTypeConfig).includes(id)) {
      throw new ApiError(HttpStatus.CONFLICT, 'Cannot delete message type that is used in system actions');
    }

    // Do not delete message type if id is used as FK anywhere
    // Depends on registry which models have associations
    const associatedModels = getAssociationModels(REGISTRY);
    const assocationBooleans = await Promise.all(associatedModels.map(model => hasAssociations(model, id)));

    // If any check produced result that message type has associations, refuse to remove
    if (assocationBooleans.some(v => v)) {
      throw new ApiError(HttpStatus.CONFLICT, 'Cannot delete message type as it has associations to either messages or message types');
    }

    return messageTypeModelInterface.remove(id);
  }


  /**
   * Get associations regarding message types
   * @param {string} registry Registry to interact witch
   * @returns Array of sequelize models that contain message_type_id as FK column
   */
  function getAssociationModels(registry) {
    if (registry === COMMON_REGISTRY_TYPES.ISBN_ISMN) {
      return [
        sequelize.models.messageTemplateIsbn,
        sequelize.models.messageIsbn,
        sequelize.models.groupMessageIsbn
      ];
    }

    if (registry === COMMON_REGISTRY_TYPES.ISSN) {
      return [
        sequelize.models.messageTemplateIssn,
        sequelize.models.messageIssn
      ];
    }

    throw Error('Invalid registry type. Cannot initialize interface for message types.');
  }

  /**
   * Utility function for defining whether the message type id has associations regarding the model given as input
   * @param {Object} model Sequelize model
   * @param {number} messageTypeId Message type id to check associations for
   * @returns True if there are existing FK associations that can be found using the sequelize model, otherwise false
   */
  async function hasAssociations(model, messageTypeId) {
    const numberOfAssociations = await model.count({where: {messageTypeId}});
    return numberOfAssociations > 0;
  }
}
