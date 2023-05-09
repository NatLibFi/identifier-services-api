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
import {WEBSITE_USER} from '../../config';
import {ISSN_REGISTRY_FORM_STATUS, ISSN_REGISTRY_PUBLICATION_STATUS} from '../constants';
import {generateQuery} from '../interfaceUtils';
import abstractModelInterface from '../common/abstractModelInterface';

/**
 * ISSN request form interface. Contains CRU operations and a number of helper functions.
 * @returns Interface to interact with ISSN request forms
 */
export default function () {
  const issnFormModel = sequelize.models.issnForm;
  const issnFormArchiveModel = sequelize.models.issnFormArchive;
  const issnUsedModel = sequelize.models.issnUsed;
  const publicationIssnModel = sequelize.models.publicationIssn;
  const publicationIssnArchiveModel = sequelize.models.publicationIssnArchive;
  const publisherIssnModel = sequelize.models.publisherIssn;
  const messageIssnModel = sequelize.models.messageIssn;

  const issnFormModelInterface = abstractModelInterface(issnFormModel);
  const publisherIssnModelInterface = abstractModelInterface(publisherIssnModel);

  return {
    create,
    read,
    remove,
    query,
    update,
    setPublisher,
    addPublisher,
    getArchiveRecord
  };

  /**
   * Creates ISSN request form entry to database
   * @param {Object} doc Request information document
   * @param {Object} user User initiating the request
   * @returns Created resource as object
   */
  /* eslint-disable-next-line max-statements */
  async function create(doc, user) {
    const t = await sequelize.transaction();

    try {
      // Start transaction
      const {form, publications} = doc;
      const metadata = {
        createdBy: user ? user.id : WEBSITE_USER,
        modifiedBy: user ? user.id : WEBSITE_USER
      };

      // Save form to db
      const result = await issnFormModel.create({
        ...form,
        ...metadata,
        publicationCount: publications.length,
        publicationCountIssn: 0,
        publisherId: null,
        status: ISSN_REGISTRY_FORM_STATUS.NOT_HANDLED
      }, {transaction: t});

      // Save archive information of form to db
      await issnFormArchiveModel.create({
        ...form,
        formId: result.id,
        publicationCount: publications.length,
        createdBy: metadata.createdBy
      }, {transaction: t});

      // Save publications and their archive information
      // Loop is used instead of resolving Promise.all
      // so that the link between archive record and publication can be established
      /* eslint-disable functional/no-loop-statements,no-await-in-loop */
      for (const publication of publications) {
        const previous = getPublicationJSONattribute(publication.previous, ['title', 'issn', 'lastIssue']);
        const mainSeries = getPublicationJSONattribute(publication.mainSeries);
        const subseries = getPublicationJSONattribute(publication.subseries);
        const anotherMedium = getPublicationJSONattribute(publication.anotherMedium);

        const publicationResult = await publicationIssnModel.create({
          ...publication,
          ...metadata,
          previous,
          mainSeries,
          subseries,
          anotherMedium,
          placeOfPublication: publication.placeOfPublication ? publication.placeOfPublication : '', // SQL installation doc of previous application describes this field with NOT NULL constraint
          formId: result.id
        }, {transaction: t});

        // Save archive information
        await publicationIssnArchiveModel.create({
          ...publication,
          previous,
          mainSeries,
          subseries,
          anotherMedium,
          placeOfPublication: publication.placeOfPublication ? publication.placeOfPublication : '', // SQL installation doc of previous application describes this field with NOT NULL constraint
          createdBy: metadata.createdBy,
          formId: result.id,
          publicationId: publicationResult.id
        }, {transaction: t});
      }

      // Commit transaction since no errors have occurred
      await t.commit();

      return result.toJSON();
    } catch (err) {
      await t.rollback();
      throw err;
    }


    function getPublicationJSONattribute(attr, keys = ['title', 'issn']) {
      if (!attr || typeof attr !== 'object') {
        return keys.reduce((prev, acc) => ({...prev, [acc]: ['']}), {});
      }

      return keys.reduce((prev, acc) => ({...prev, [acc]: attr[acc] ?? ['']}), {});
    }
  }

  /**
   * Read ISSN request form from database
   * @param {number} id ID of request form to read from database
   * @returns {Object} Request form object if it was found from database, otherwise throws ApiError
   */
  async function read(id) {
    const result = await issnFormModel.findByPk(id, {
      include: [
        {
          association: 'publicationIssn',
          attributes: ['id', 'title', 'subtitle', 'issn', 'language', 'medium', 'status', 'created', 'createdBy', 'modified', 'modifiedBy']
        },
        {
          association: 'publisherIssn',
          attributes: ['id', 'officialName']
        }
      ]
    });

    if (result !== null) {
      // Change virtual attribute of publisher name
      const {publisherIssn, ...formattedResult} = result.toJSON();
      formattedResult.publisherName = publisherIssn?.officialName ? publisherIssn.officialName : null; // eslint-disable-line functional/immutable-data

      return formattedResult;
    }

    throw new ApiError(HttpStatus.NOT_FOUND);
  }

  /**
   * Updates ISSN request form entry
   * @param {number} id Id of document to update
   * @param {Object} doc Document containing information to update
   * @param {Object} user User initiating the request
   * @returns Updated ISSN request form as object
   */
  // eslint-disable-next-line max-statements
  async function update(id, doc, user) {
    const t = await sequelize.transaction();
    try {
      const issnRequest = await issnFormModelInterface.read(id, t);

      // Status may be set only to either rejected or not_handled through GUI
      // Status of not_notified is automatically when all form publications have ISSN
      // Status of completed is automatically set when message is sent after all publications have ISSN
      /* Restriction regarding changing status manually has been lifted
      if (doc.status) {
        const changeableStatuses = [ISSN_REGISTRY_FORM_STATUS.NOT_HANDLED, ISSN_REGISTRY_FORM_STATUS.NOT_NOTIFIED, ISSN_REGISTRY_FORM_STATUS.REJECTED];
        if (doc.status !== issnRequest.status && !changeableStatuses.includes(issnRequest.status)) {
          throw new ApiError(HttpStatus.CONFLICT, 'Cannot update form status manually when form is being or has been processed');
        }
      }
      */

      const dbDoc = {...doc, modifiedBy: user.id};

      // Sanity verification: Remove attributes not allowed to update/overwrite
      /* eslint-disable functional/immutable-data */
      delete dbDoc.publisherId;
      delete dbDoc.publicationCount;
      delete dbDoc.publicationCountIssn;
      delete dbDoc.publisherCreated;
      delete dbDoc.created;
      delete dbDoc.createdBy;
      delete dbDoc.modified;
      /* eslint-enable functional/immutable-data */

      // Save to db
      const result = await issnRequest.update(dbDoc, {transaction: t});

      // Update status of publications associated to form to NO_ISSN_GRANTED if form status
      // was changed to REJECTED
      if (doc.status === ISSN_REGISTRY_FORM_STATUS.REJECTED) {
        // Confirm that no publication has been given issn: information in publication model
        const formPublications = await publicationIssnModel.findAll({where: {formId: id}, transaction: t});
        const formPublicationIds = formPublications.map(publication => publication.id);

        if (formPublications.some(publication => publication.issn !== null && publication.issn !== '')) {
          throw new ApiError(HttpStatus.CONFLICT, 'Publication associated with form has already an ISSN number. Cannot update status to REJECTED.');
        }

        // Sanity check: issnUsed should not have associations with publications associated with form
        const formPublicationUsedIssnCount = await issnUsedModel.count({where: {publicationId: {[Op.in]: formPublicationIds}}, transaction: t});
        if (formPublicationUsedIssnCount !== 0) {
          throw new ApiError(HttpStatus.CONFLICT, 'Publication associated with form is linked to an used ISSN number. Cannot update status to REJECTED.');
        }

        const publicationUpdate = {status: ISSN_REGISTRY_PUBLICATION_STATUS.NO_ISSN_GRANTED, modifiedBy: user.id};
        const publicationUpdateResult = await publicationIssnModel.update(publicationUpdate, {where: {formId: id}, transaction: t});

        if (publicationUpdateResult[0] !== issnRequest.publicationCount) {
          throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Could not update publication status to database');
        }
      }

      // Verify all publications where updated
      await t.commit();
      return result.toJSON();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * Removes ISSN request from entry from database. Entry can be removed only if no identifier has been granted to any of associated publications.
   * Destroys also all associated publications, archive entries and messages. Deassociates publisher which has been created from the request forms information.
   * @param {number} id Id of document to update
   * @returns True if process succeeds, otherwise throws ApiError
   */
  // eslint-disable-next-line max-statements
  async function remove(id) {
    const t = await sequelize.transaction();

    try {
      const issnRequest = await issnFormModelInterface.read(id, t);

      // Get related publications that have ISSN assigned
      const publications = await publicationIssnModel.findAll({
        where: {
          formId: id
        },
        transaction: t
      });

      // If any publication has issn assigned based on the publication model information, cancel delete
      if (publications.length > 0 && publications.some(p => p.issn !== '')) {
        throw new ApiError(HttpStatus.CONFLICT, 'Form is associated with publications which have ISSN identifier defined - cannot delete');
      }

      // Sanity check: there should not exist any issn identifier with FK link to publications linked with form
      const publicationIds = publications.map(publication => publication.id);
      const linkedIdentifiersCount = await issnUsedModel.count({
        where: {
          publicationId: {
            [Op.in]: publicationIds
          }
        },
        transaction: t
      });

      // Do not delete form in case there is conflicting information about identifier association
      if (linkedIdentifiersCount > 0) {
        throw new ApiError(HttpStatus.CONFLICT, 'Form is associated with publications which have an association to ISSN identifier!');
      }

      // Delete publications
      const publicationDeletedCount = await publicationIssnModel.destroy({
        where: {
          formId: id
        },
        transaction: t
      });

      if (publicationDeletedCount !== issnRequest.publicationCount) {
        throw new ApiError(HttpStatus.CONFLICT, 'Publications associated with form information could not be deleted.');
      }

      // Delete publication archive
      const publicationArchiveDeletedCount = await publicationIssnArchiveModel.destroy({
        where: {
          formId: id
        },
        transaction: t
      });

      if (publicationArchiveDeletedCount !== issnRequest.publicationCount) {
        throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Publication archive information associated with form information could not be deleted.');
      }

      // Delete form archive
      const formArchiveDeletedCount = await issnFormArchiveModel.destroy({
        where: {
          formId: id
        },
        transaction: t
      });

      if (formArchiveDeletedCount !== 1) {
        throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Form archive information associated with form information could not be deleted.');
      }

      // Delete messages linked to form
      await messageIssnModel.destroy({
        where: {
          formId: id
        },
        transaction: t
      });

      // In case publisher information is linked to form, remove all linking formIds to the form which is to be deleted
      await publisherIssnModel.update({formId: null}, {where: {formId: id}, transaction: t});

      // Delete form information
      await issnRequest.destroy({transaction: t});

      // Commit transaction since all operations where successful
      await t.commit();

      return true;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * Query ISSN request forms.
   * @param {Objects} searchOpts Search options
   * @returns Object containing results if succeeds, otherwise throws ApiError
   */
  async function query(searchOpts) {
    const {publisherId, status, searchText, offset, limit} = searchOpts;
    const order = [['id', 'DESC']];
    const searchAttributes = ['publisher', 'email'];

    const publisherCondition = publisherId ? {publisherId} : undefined;
    const textConditions = searchText ? {[Op.or]: generateQuery(searchAttributes, searchText)} : undefined;
    const statusConditions = status ? _getConditionsByStatus(status) : undefined;

    const result = await issnFormModel.findAndCountAll({
      attributes: ['id', 'publisher', 'publicationCount', 'publicationCountIssn', 'status', 'created'],
      where: {
        [Op.and]: [
          {...publisherCondition},
          {...textConditions},
          {...statusConditions}
        ]
      },
      limit,
      offset,
      order
    });

    // toJSON formats result using sequelize virtual getters. This does not happen if
    // raw option is used during query.
    const formattedResults = result.rows.map(v => v.toJSON());
    return {totalDoc: result.count, results: formattedResults};

    function _getConditionsByStatus(status) {
      if (!status || status === '') {
        return {};
      }

      if (Object.values(ISSN_REGISTRY_FORM_STATUS).includes(status)) {
        return {
          status
        };
      }

      throw new Error('Unknown status');
    }
  }

  /**
   * Sets publisher to selected ISSN request form and all publication associated with the form.
   * @param {number} id Id of ISSN request form to associate
   * @param {Object} actionOptions Publisher ID to associate form and publications with
   * @param {Object} user User associating publisher with request
   * @returns {Object} Updated ISSN request form object
   */
  async function setPublisher(id, {publisherId}, user) {
    const t = await sequelize.transaction();

    try {
      const issnRequest = await issnFormModelInterface.read(id, t);

      // eslint-disable-next-line functional/no-conditional-statements
      if (publisherId !== null) {
        await publisherIssnModelInterface.read(publisherId, t); // Verifies publisher can be found from db
      }

      const dbDoc = {publisherId, modifiedBy: user.id};

      // Save to db, utilizing read-function of interface for response
      await issnRequest.update(dbDoc, {transaction: t});

      // Set publisher to all publications associated with form
      const publicationUpdateResult = await publicationIssnModel.update(dbDoc, {where: {formId: id}, transaction: t});

      // Verify all publications were updated
      if (publicationUpdateResult[0] !== issnRequest.publicationCount) {
        throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'Error in updating publisher information to publications associated with form');
      }

      await t.commit();
      return read(id);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * Create publisher entity from ISSN request information given as parameter. Created entity is associated
   * to the form it was created from.
   * @param {number} id ISSN request form ID to create ISSN publisher from
   * @param {Object} user User making the request
   * @returns {Object} Created ISSN publisher object
   */
  // eslint-disable-next-line max-statements
  async function addPublisher(id, user) {
    const t = await sequelize.transaction();
    try {
      const issnRequest = await issnFormModelInterface.read(id, t);

      // Test that publisher has not been created from this form before
      // eslint-disable-next-line no-extra-parens
      if (issnRequest.publisherCreated || (issnRequest.publisherId !== null && issnRequest.publisherId > 0)) {
        throw new ApiError(HttpStatus.CONFLICT, 'ISSN form is already associated with publisher');
      }

      // Test that any publisher does not have backlink to this form regarding creation
      const linkedPublishersCount = await publisherIssnModel.count({where: {formId: id}, transaction: t});

      if (linkedPublishersCount > 0) {
        throw new ApiError(HttpStatus.CONFLICT, 'A publisher has link to this form already! Cannot create new publisher.');
      }

      const publisherInformation = {
        formId: id,
        officialName: issnRequest.publisher,
        contactPerson: {
          name: issnRequest.contactPerson ? [issnRequest.contactPerson] : [],
          email: issnRequest.email ? [issnRequest.email] : []
        },
        emailCommon: issnRequest.email ? issnRequest.email : '',
        phone: issnRequest.phone,
        address: issnRequest.address,
        zip: issnRequest.zip,
        city: issnRequest.city,
        langCode: issnRequest.langCode,
        createdBy: user.id,
        modifiedBy: user.id
      };

      // Save publisher to db
      const result = await publisherIssnModel.create(publisherInformation, {transaction: t});

      // Update request information
      await issnRequest.update({publisherId: result.id, publisherCreated: true, modifiedBy: user.id}, {transaction: t});

      // Set created publisher to all publications associated with form
      const publicationUpdateResult = await publicationIssnModel.update({publisherId: result.id, modifiedBy: user.id}, {where: {formId: id}, transaction: t});

      // Verify all publications were updated
      if (publicationUpdateResult[0] !== issnRequest.publicationCount) {
        throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'Error in updating newly created publisher information to publications associated with form');
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
   * Read ISSN request form archive record from database
   * @param {number} id ID of request form to read associated archive record from database
   * @returns {Object} Request form object if it was found from database, otherwise throws ApiError
   */
  async function getArchiveRecord (id) {
    const result = await issnFormArchiveModel.findAll({
      where: {
        formId: id
      }
    });

    if (result !== null || result.length > 0) {
      if (result.length === 1) {
        return result[0].toJSON();
      }
      throw new ApiError(HttpStatus.CONFLICT, 'Found more than one archive record, please contact system administrator.');
    }

    throw new ApiError(HttpStatus.NOT_FOUND);
  }
}
