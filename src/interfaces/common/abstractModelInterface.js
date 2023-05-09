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

import {ApiError} from '../../utils';
import sequelize from '../../models';

/**
 * Abstract interface that provides CRUD operations for the model given as parameter.
 * @param model Sequelize model
 * @returns CRUD interface
 */
export default function (model) {
  return {
    create,
    remove,
    update,
    read,
    readJSON
  };

  /**
   * Create new entity
   * @param {Object} doc Document to insert to database
   * @param {Object} transaction Sequelize transaction to use for running the query
   * @returns Promise which resolves into created sequelize model instance
   */
  // eslint-disable-next-line require-await
  async function create(doc, transaction = undefined) {
    return model.create(doc, {transaction});
  }

  /**
   * Destroy row from database
   * @param {number} id Row id to destroy
   * @param {Object} transaction Sequelize transaction to use for running the query
   * @returns True if row was deleted, otherwise false. Throws ApiError if entity with selected id cannot be found.
   */
  async function remove(id, transaction = undefined) {
    // Declare transaction in this scope if it was not yet declared
    const t = transaction || await sequelize.transaction();
    try {
      const entity = await model.findByPk(id, {transaction: t});

      if (entity === null) {
        throw new ApiError(HttpStatus.NOT_FOUND);
      }

      const result = await model.destroy({where: {id}, transaction});

      // Check that only one row was removed
      if (result === 1) {
        // If transaction was declared in this scope, it needs to be committed in this scope also
        if (!transaction) { // eslint-disable-line functional/no-conditional-statements
          await t.commit();
        }

        return true;
      }

      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Could not properly delete entity from database');
    } catch (err) {
      // If transaction was declared in this scope, rollback transaction
      if (!transaction) { // eslint-disable-line functional/no-conditional-statements
        await t.rollback();
      }

      // Throw error upwards
      throw err;
    }
  }

  /**
   * Update row in database
   * @param {number} id Row id to update
   * @param {Object} doc Values to update
   * @param {Object} transaction Sequelize transaction to use for running the query
   * @returns Promise resolving to updated sequelize model instance. Throws ApiError if entity with selected id cannot be found.
   */
  async function update(id, doc, transaction = undefined) {
    const entity = await model.findByPk(id, {transaction});

    if (entity === null) {
      throw new ApiError(HttpStatus.NOT_FOUND);
    }

    return entity.update(doc, {transaction});
  }

  /**
   * Read row from database
   * @param {number} id Row id to read
   * @param {Object} transaction Sequelize transaction to use for running the query
   * @returns Promise which resolves into sequelize model instance if successful. Throws ApiError if entity could not be found using id.
   */
  // eslint-disable-next-line require-await
  async function read(id, transaction = undefined) {
    const entity = await model.findByPk(id, {transaction});

    if (entity === null) {
      throw new ApiError(HttpStatus.NOT_FOUND);
    }

    return entity;
  }

  /**
   * Read row from database and return JSON representation
   * @param {number} id Row id to read
   * @param {Object} transaction Sequelize transaction to use for running the query
   * @returns ApiError or JSON representation of read database instance
   */
  // eslint-disable-next-line require-await
  async function readJSON(id, transaction = undefined) {
    const result = await read(id, transaction);
    return result.toJSON();
  }
}
