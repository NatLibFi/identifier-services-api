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

import sequelize from '../../models';
import {ApiError} from '../../utils';
import abstractModelInterface from '../common/abstractModelInterface';
import {generateQuery} from '../interfaceUtils';

/**
 * ISSN publisher interface. Contains CRUD + query operations.
 * @returns Interface to interact with ISSN publishers
 */
export default function () {
  const issnFormModel = sequelize.models.issnForm;
  const publicationIssnModel = sequelize.models.publicationIssn;
  const publisherIssnModel = sequelize.models.publisherIssn;
  const messageIssnModel = sequelize.models.messageIssn;

  const publisherIssnModelInterface = abstractModelInterface(publisherIssnModel);

  return {
    create,
    read: publisherIssnModelInterface.readJSON,
    remove,
    query,
    update,
    autoComplete
  };

  /**
   * Create ISSN publisher
   * @param {Object} doc Document containing new publishers information
   * @param {Object} user User creating the new publication
   * @returns {Object} Created publisher as object
   */
  /* eslint-disable-next-line max-statements */
  async function create(doc, user) {
    const result = await publisherIssnModelInterface.create({
      ...doc,
      createdBy: user.id,
      modifiedBy: user.id
    });

    return result.toJSON();
  }

  /**
   * Update ISSN publisher's attributes that may be updated.
   * @param {number} id ID of publisher to update
   * @param {Object} doc Update values
   * @param {Object} user User making the update
   * @returns {Object} Updated ISSN publisher
   */
  async function update(id, doc, user) {
    const dbDoc = {...doc, modifiedBy: user.id};

    // Sanity verification: Remove attributes not allowed to update/overwrite
    /* eslint-disable functional/immutable-data */
    delete dbDoc.id;
    delete dbDoc.idOld;
    delete dbDoc.formId;
    delete dbDoc.created;
    delete dbDoc.createdBy;
    delete dbDoc.modified;
    /* eslint-enable functional/immutable-data */

    const result = await publisherIssnModelInterface.update(id, dbDoc);
    return result.toJSON();
  }

  /**
   * Remove ISSN publisher, messages related to it and deassociate creation form if publisher was created through
   * form creation action and later deassociated with said form.
   * Publisher can be removed if there are no issn forms or publications associated with it.
   * @param {number} id ID of publisher to remove
   * @param {Object} user User removing the publication
   * @returns True if removal was successful, otherwise throws ApiError
   */
  // eslint-disable-next-line max-statements
  async function remove(id, user) {
    const t = await sequelize.transaction();
    try {
      const issnPublisher = await publisherIssnModelInterface.read(id, t);

      // See if there are forms or publications linked to the publisher
      const publisherFormCount = await issnFormModel.count({where: {publisherId: id}, transaction: t});
      const publisherPublicationCount = await publicationIssnModel.count({where: {publisherId: id}, transaction: t});

      // Do not delete publisher if there are existing associations
      if (publisherFormCount !== 0 || publisherPublicationCount !== 0) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot delete publisher which is associated with form or publication information');
      }

      // If publisher was created through a form and afterwards deassociated with said form, remove note that publisher was created from form
      if (issnPublisher.formId && issnPublisher.formId !== 0) {
        const creationForm = await issnFormModel.findByPk(issnPublisher.formId, {transaction: t});
        if (creationForm !== null) { // eslint-disable-line functional/no-conditional-statements
          await creationForm.update({publisherCreated: false, modifiedBy: user.id}, {transaction: t});
        }
      }

      // Delete messages associated with this publisher
      await messageIssnModel.destroy({
        where: {
          publisherId: id
        },
        transaction: t
      });

      // Delete publisher
      const result = await publisherIssnModel.destroy({where: {id}}, {transaction: t});

      if (result === 1) {
        // Commit transaction
        await t.commit();
        return true;
      }

      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Error in deleting publisher from db');
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async function query(guiOpts) {
    const {searchText, offset, limit} = guiOpts;
    const searchAttributes = ['officialName', 'additionalInfo'];
    const order = [['id', 'DESC']];

    const textConditions = searchText ? {[Op.or]: generateQuery(searchAttributes, searchText.trim())} : undefined;
    const result = await publisherIssnModel.findAndCountAll({
      attributes: ['id', 'officialName', 'emailCommon', 'phone', 'langCode'],
      where: {
        ...textConditions
      },
      limit,
      offset,
      order
    });

    const formattedResults = result.rows.map(v => v.toJSON());
    return {totalDoc: result.count, results: formattedResults};
  }

  /**
   * Query publisher ISSN publishers for autocomplete. Separated from query endpoint to increase performance.
   * Also, for admin use only.
   * @param {Object} guiOpts Search options
   * @returns Result set of the query
   */
  /* eslint-disable max-statements,complexity */

  async function autoComplete(guiOpts) {
    const {searchText} = guiOpts;
    const attributes = ['id', 'officialName'];
    const offset = 0;
    const limit = 10;

    const searchAttributes = ['officialName'];
    const order = [['officialName', 'ASC']];

    const textConditions = searchText ? {[Op.or]: generateQuery(searchAttributes, searchText.trim())} : undefined;
    const result = await publisherIssnModel.findAll({
      attributes,
      where: {
        ...textConditions
      },
      limit,
      offset,
      order
    });

    return result.map(v => v.toJSON());
  }
}
