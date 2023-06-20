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

import sequelize from '../../models';
import {ApiError} from '../../utils';
import abstractModelInterface from '../common/abstractModelInterface';
import {ISSN_REGISTRY_FORM_STATUS, ISSN_REGISTRY_PUBLICATION_MEDIUM, ISSN_REGISTRY_PUBLICATION_STATUS} from '../constants';
import {generateQuery} from '../interfaceUtils';
import {calculateCheckDigitIssn, validateIssn} from './rangeUtils';


/**
 * ISSN publications interface. Contains CRUD + query operations.
 * @returns Interface to interact with ISSN publishers
 */
export default function () {
  const issnFormModel = sequelize.models.issnForm;
  const publisherIssnModel = sequelize.models.publisherIssn;
  const publicationIssnModel = sequelize.models.publicationIssn;
  const publicationIssnArchiveModel = sequelize.models.publicationIssnArchive;
  const issnRangeModel = sequelize.models.issnRange;
  const issnUsedModel = sequelize.models.issnUsed;
  const issnCanceledModel = sequelize.models.issnCanceled;

  const issnFormModelInterface = abstractModelInterface(issnFormModel);
  const publisherIssnModelInterface = abstractModelInterface(publisherIssnModel);
  const publicationIssnModelInterface = abstractModelInterface(publicationIssnModel);
  const publicationIssnArchiveModelInterface = abstractModelInterface(publicationIssnArchiveModel);
  const issnRangeModelInterface = abstractModelInterface(issnRangeModel);

  return {
    create,
    read,
    readArchiveEntry,
    remove,
    query,
    update,
    getIssn,
    deleteIssn
  };

  /**
   * Create ISSN publication
   * @param {number} formId Form to associate the new publication with
   * @param {Object} doc Document containing new publication's information
   * @param {Object} user User creating the new publication
   * @returns {Object} Created publication as object
   */
  /* eslint-disable-next-line max-statements */
  async function create(formId, doc, user) {
    const t = await sequelize.transaction();

    try {
      // Test that form exists
      const issnForm = await issnFormModelInterface.read(formId, t);

      // If ISSN form is completed or rejected, do not allow creationg of new publications associated with it
      if (issnForm.status === ISSN_REGISTRY_FORM_STATUS.COMPLETED || issnForm.status === ISSN_REGISTRY_FORM_STATUS.REJECTED) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot add publications to form that is either rejected or completed');
      }

      // Format JSONified values
      const previous = getPublicationJSONattribute(doc.previous, ['title', 'issn', 'lastIssue']);
      const mainSeries = getPublicationJSONattribute(doc.mainSeries);
      const subseries = getPublicationJSONattribute(doc.subseries);
      const anotherMedium = getPublicationJSONattribute(doc.anotherMedium);

      // Save publication to db
      const result = await publicationIssnModelInterface.create({
        ...doc,
        previous,
        mainSeries,
        subseries,
        anotherMedium,
        placeOfPublication: doc.placeOfPublication ? doc.placeOfPublication : '', // SQL installation doc of previous application describes this field with NOT NULL constraint
        formId,
        publisherId: issnForm.publisherId, // Publisher id should be same as with form
        createdBy: user.id,
        modifiedBy: user.id
      }, t);

      // Save archive entry
      await publicationIssnArchiveModelInterface.create({
        ...doc,
        previous,
        mainSeries,
        subseries,
        anotherMedium,
        placeOfPublication: doc.placeOfPublication ? doc.placeOfPublication : '',
        formId,
        publicationId: result.id,
        createdBy: user.id
      }, t);

      // Increase form publication counter and alter status if it's "NOT_NOTIFIED"
      const formUpdate = {
        publicationCount: issnForm.publicationCount + 1,
        status: issnForm.status === ISSN_REGISTRY_FORM_STATUS.NOT_NOTIFIED ? ISSN_REGISTRY_FORM_STATUS.NOT_HANDLED : issnForm.status,
        modifiedBy: user.id
      };

      // Update form to db
      await issnForm.update(formUpdate, {transaction: t});

      // Commit transaction
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
   * Read ISSN publication from database
   * @param {number} id ID of ISSN publication to read from database
   * @returns {Object} ISSN Publication object if it was found from database, otherwise throws ApiError
   */
  async function read(id) {
    const result = await publicationIssnModel.findByPk(id, {
      include: [
        {
          association: 'publisher',
          attributes: ['officialName']
        }
      ]
    });

    if (result !== null) {
      return result.toJSON();
    }

    throw new ApiError(HttpStatus.NOT_FOUND);
  }

  /**
   * Read ISSN publication archive entry from database
   * @param {number} id ID of ISSN publication to read archive entry for from database
   * @returns {Object} ISSN Publication archive entry object if it was found from database, otherwise throws ApiError
   */
  async function readArchiveEntry(id) {
    const result = await publicationIssnArchiveModel.findOne({where: {publicationId: id}});

    if (result !== null) {
      return result.toJSON();
    }

    throw new ApiError(HttpStatus.NOT_FOUND);
  }

  /**
   * Update ISSN publication attributes that may be updated.
   * @param {number} id ID of publication to update
   * @param {Object} doc Update values
   * @param {Object} user User making the update
   * @returns {Object} Updated ISSN publication
   */
  async function update(id, doc, user) {
    const jsonAttributes = {
      previous: doc.previous ? getPublicationJSONattribute(doc.previous, ['title', 'issn', 'lastIssue']) : undefined,
      mainSeries: doc.mainSeries ? getPublicationJSONattribute(doc.mainSeries) : undefined,
      subseries: doc.subseries ? getPublicationJSONattribute(doc.subseries) : undefined,
      anotherMedium: doc.anotherMedium ? getPublicationJSONattribute(doc.anotherMedium) : undefined
    };

    const dbDoc = {...doc, ...jsonAttributes, modifiedBy: user.id};

    // Sanity verification: Remove attributes not allowed to update/overwrite
    // These should be taken care by validation, but just to be sure
    /* eslint-disable functional/immutable-data */
    delete dbDoc.id;
    delete dbDoc.formId;
    delete dbDoc.publisherId;
    delete dbDoc.issn;
    delete dbDoc.created;
    delete dbDoc.createdBy;
    delete dbDoc.modified;
    /* eslint-enable functional/immutable-data */

    // Abstract interface both finds and updates
    await publicationIssnModelInterface.update(id, dbDoc);

    // Return interace's read to access associated publisher officialName
    return read(id);

    function getPublicationJSONattribute(attr, keys = ['title', 'issn']) {
      if (!attr || typeof attr !== 'object') {
        return keys.reduce((prev, acc) => ({...prev, [acc]: ['']}), {});
      }

      return keys.reduce((prev, acc) => ({...prev, [acc]: attr[acc] ?? ['']}), {});
    }
  }

  /**
   * Remove ISSN publication. Publication can be removed if it does not have ISSN identifier.
   * @param {number} id ID of publication to remove
   * @param {Object} user User removing the publication
   * @returns True if removal was successful, otherwise throws ApiError
   */
  // eslint-disable-next-line max-statements
  async function remove(id, user) {
    const t = await sequelize.transaction();
    try {
      const issnPublication = await publicationIssnModelInterface.read(id, t);
      const issnForm = await issnFormModelInterface.read(issnPublication.formId, t);

      // Publication with ISSN information cannot be deleted
      if (issnPublication.issn !== null && issnPublication.issn !== '') {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot delete publication since it has been assigned an ISSN identifier');
      }

      // Sanity check: there should not be associations to issnUsed objects
      const issnUsedCount = await issnUsedModel.count({where: {publicationId: id}});
      if (issnUsedCount > 0) {
        throw new ApiError(HttpStatus.CONFLICT, 'Publication has ISSN entity associations! Cannot delete.');
      }

      // Delete archive model
      const archiveRemoveResult = await publicationIssnArchiveModel.destroy({where: {publicationId: id}}, {transaction: t});
      if (archiveRemoveResult !== 1) {
        throw new ApiError(HttpStatus.CONFLICT, 'Deletion failed because of deletion archive entry failed');
      }

      // Decrease form publication counter
      const formUpdate = {
        publicationCount: issnForm.publicationCount - 1,
        modifiedBy: user.id
      };

      // Update form to db
      await issnForm.update(formUpdate, {transaction: t});

      // Remove publication from db
      await publicationIssnModelInterface.remove(id, t);

      // Commit transaction
      await t.commit();
      return true;

    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  /**
   * Query ISSN registry publications
   * @param {Object} searchOpts Search options to use for querying
   * @returns {Object} Paged search results
   */
  async function query(searchOpts) {
    const {publisherId, formId, status, searchText, offset, limit} = searchOpts;
    const order = [['id', 'DESC']];

    const searchAttributes = ['title', 'subtitle', 'issn'];

    // Cannot limit by both publisherId and formId
    if (publisherId && formId) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'Search available only using either formId or publisherId along with other attributes');
    }

    const publisherCondition = publisherId ? {publisherId} : undefined;
    const formCondition = formId ? {formId} : undefined;
    const textConditions = searchText ? {[Op.or]: generateQuery(searchAttributes, searchText.trim())} : undefined;
    const statusConditions = status ? {status} : undefined;

    const result = await publicationIssnModel.findAndCountAll({
      attributes: ['id', 'issn', 'title', 'language', 'medium', 'status', 'created'],
      where: {
        [Op.and]: [
          {...publisherCondition},
          {...formCondition},
          {...textConditions},
          {...statusConditions}
        ]
      },
      limit,
      offset,
      order
    });

    const formattedResults = result.rows.map(v => v.toJSON());
    return {totalDoc: result.count, results: formattedResults};
  }

  /**
   * Associate next free ISSN identifier from active range to selected publication
   * @param {number} publicationId Publication to assign ISSN identifier to
   * @param {Object} user User assigning the ISSN
   * @returns {Object} Created issnUsed identifier object
   */
  /* eslint-disable max-statements,complexity,functional/no-conditional-statements */
  async function getIssn(publicationId, user) {
    const t = await sequelize.transaction();

    try {
      // Get active range
      const range = await issnRangeModel.findOne({where: {isActive: true}, transaction: t});
      if (!range) {
        throw new ApiError(HttpStatus.CONFLICT, 'Could not find active ISSN range');
      }

      // Get publication using ID
      const publication = await publicationIssnModelInterface.read(publicationId, t);

      // Verify that the publication has publisher set
      await publisherIssnModelInterface.read(publication.publisherId, t); // Verifies publisher exists in db

      // Publication needs to have valid medium
      if (!publication.medium || !Object.values(ISSN_REGISTRY_PUBLICATION_MEDIUM).includes(publication.medium)) {
        throw new ApiError(HttpStatus.CONFLICT, 'Publication medium either does not exist or is invalid');
      }

      // Verify publication does not have issn yet
      if (publication.issn !== '') {
        throw new ApiError(HttpStatus.CONFLICT, 'Publication already has ISSN identifier');
      }

      // There also should not be any associations to used issn identifiers
      const publicationIdentifierAssociationsCount = await issnUsedModel.count({where: {publicationId}, transaction: t});
      if (publicationIdentifierAssociationsCount !== 0) {
        throw new ApiError(HttpStatus.CONFLICT, 'Publication is already associated with an used ISSN identifier');
      }

      // There needs to be associated form, search and verify
      const form = await issnFormModelInterface.read(publication.formId, t);

      // Get cancelled issn if one can be found
      const canceledIdentifier = await issnCanceledModel.findOne({transaction: t});

      // Initialize identifier information
      const issnIdentifier = {
        publicationId,
        issnRangeId: range.id,
        createdBy: user.id
      };

      if (canceledIdentifier) {
        // Using canceled identifier since one could be found
        // Sanity check: validate the canceled issn is valid
        if (!validateIssn(canceledIdentifier.issn)) {
          throw new ApiError(HttpStatus.CONFLICT, 'Could not create valid ISSN due to canceled identifier being invalid. Please contact system administrator.');
        }

        // If there was canceled ISSN identifier, use it and its rangeId
        issnIdentifier.issn = canceledIdentifier.issn; // eslint-disable-line
        issnIdentifier.issnRangeId = canceledIdentifier.issnRangeId // eslint-disable-line

        // Delete canceled identifier from db
        const canceledIssnDeleteCount = await issnCanceledModel.destroy({where: {id: canceledIdentifier.id}}, {transaction: t});
        if (canceledIssnDeleteCount !== 1) {
          throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Encountered an error when attempting to assign identifier that was canceled in earlier date');
        }
      } else {
        // Canceled identifier could not be found: generating new identifier from active range information

        // Sanity check: Next value cannot be empty
        if (range.next === '') {
          throw new ApiError(HttpStatus.CONFLICT, 'Issn range next value is empty which indicates there are no more identifiers that be granted from this range.');
        }

        // Generated issn value from range must be equal or greater than rangeBegin
        const nextNumber = Number(range.next.substring(0, 3));

        if (Number(nextNumber) < Number(range.rangeBegin.substring(0, 3))) {
          throw new ApiError(HttpStatus.CONFLICT, 'Issn range begin value is greater than the anticipated ISSN. Please contact system administrator.');
        }

        // Generated issn value from range must be equal or smaller than rangeEnd
        if (Number(nextNumber) > Number(range.rangeEnd.substring(0, 3))) {
          throw new ApiError(HttpStatus.CONFLICT, 'Issn range end value is smaller than the anticipated ISSN. Please contact system administrator.');
        }

        // Sanity check: generated issn is valid
        const newIssn = `${range.block}-${range.next}`;

        if (!validateIssn(newIssn)) {
          throw new ApiError(HttpStatus.CONFLICT, 'Could not create valid ISSN. Please contact system administrator.');
        }

        // Set identifier information to new ISSN entity. Range information is already there
        issnIdentifier.issn = newIssn; // eslint-disable-line

        // Testing if this value was last from the range
        if (range.next === range.rangeEnd) {
          // In range update, we need to inactivate and close the range
          // Also setting next to empty string and updating free and taken values
          const rangeUpdateInfo = {
            isActive: false,
            isClosed: true,
            next: '',
            free: range.free - 1,
            taken: range.taken + 1,
            modifiedBy: user.id
          };

          await range.update(rangeUpdateInfo, {transaction: t});
        } else {
          // Calculating new next value
          const newNextBase = (Number(range.next.substring(0, 3)) + 1).toString().padStart(3, '0');
          const newNextCheckDigit = calculateCheckDigitIssn(`${range.block}${newNextBase}`);

          // Validate value
          const newNext = `${newNextBase}${newNextCheckDigit}`;
          if (!validateIssn(`${range.block}-${newNext}`)) {
            throw new ApiError(HttpStatus.CONFLICT, 'Could not calculate valid next value for the ISSN range. Please contact system administrator.');
          }

          // Updating next, free and taken values
          const rangeUpdateInfo = {
            next: newNext,
            free: range.free - 1,
            taken: range.taken + 1,
            modifiedBy: user.id
          };

          await range.update(rangeUpdateInfo, {transaction: t});
        }
      }

      // Update publication issn information and set status waiting for control copy
      const publicationUpdateInfo = {
        issn: issnIdentifier.issn,
        status: ISSN_REGISTRY_PUBLICATION_STATUS.WAITING_FOR_CONTROL_COPY,
        modifiedBy: user.id
      };

      await publication.update(publicationUpdateInfo, {transaction: t});

      // Increase form counters for publications with issn
      const formUpdateInfo = {
        publicationCountIssn: form.publicationCountIssn + 1,
        modifiedBy: user.id
      };

      // If all publications associated with form have issn, set status to NOT_NOTIFIED
      if (form.publicationCount === formUpdateInfo.publicationCountIssn) {
        formUpdateInfo.status = ISSN_REGISTRY_FORM_STATUS.NOT_NOTIFIED; // eslint-disable-line
      }

      await form.update(formUpdateInfo, {transaction: t});

      // Create usedIssn object to db
      const issnIdentifierResult = await issnUsedModel.create(issnIdentifier, {transaction: t});

      if (!issnIdentifierResult) {
        throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Encountered error during saving ISSN identifier. Please contact system administrator.');
      }

      // All operations have been successful - commit transaction
      await t.commit();

      // Return result through read interface
      return read(publicationId);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
  /* eslint-enable max-statements,complexity,functional/no-conditional-statements */

  /**
   * Remove ISSN identifier. Removed identifier becomes available for reuse.
   * If identifier was last given from range, the range counters are rolled back. Otherwise
   * an canceled issn identifier entry is created.
   * @param {number} publicationId Publication to remove the used ISSN from
   * @param {Object} user User removing the ISSN
   * @returns {Object} Updated publicatino object
   */
  /* eslint-disable max-statements,complexity,functional/no-conditional-statements */
  async function deleteIssn(publicationId, user) {
    const t = await sequelize.transaction();

    try {
      // Find publication and verify it exists
      const publication = await publicationIssnModelInterface.read(publicationId, t);

      // Find publications form and verify it exists
      const form = await issnFormModelInterface.read(publication.formId, t);

      // Verify it's ok to remove publication ISSN: value is not empty
      if (publication.issn === '') {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot delete issn from the selected publication as it does not exist');
      }

      // Verify it's ok to remove publication ISSN: publication status is not ISSN_FROZEN
      if (publication.status === ISSN_REGISTRY_PUBLICATION_STATUS.ISSN_FROZEN) {
        throw new ApiError(HttpStatus.CONFLICT, 'Cannot delete issn from the selected publication as status is set to ISSN_FROZEN');
      }

      // Find associated used ISSN identifier
      const allIssnAssociations = await issnUsedModel.findAndCountAll({where: {publicationId}, transaction: t});

      // Verify there is only one identifier that has association to publication
      if (allIssnAssociations.count !== 1) {
        throw new ApiError(HttpStatus.CONFLICT, 'Publication is associated with multiple issn');
      }

      // Assign used issn entity for db operations
      const usedIssn = allIssnAssociations.rows[0]; // eslint-disable-line prefer-destructuring

      // Publication information needs to match the identifier information
      if (publication.issn !== usedIssn.issn) {
        throw new ApiError(HttpStatus.CONFLICT, 'Publication issn information does not match associated database issn identifier information');
      }

      // Find used identifiers range as it's required for removal operations
      const range = await issnRangeModelInterface.read(usedIssn.issnRangeId, t);

      // Get last issn given from the range through db query
      const lastIssn = await issnUsedModel.findAll({
        attributes: ['issn'],
        where: {
          issnRangeId: usedIssn.issnRangeId
        },
        order: [['issn', 'DESC']],
        limit: 1,
        transaction: t
      });

      // There is an error if last issn cannot be found
      if (!lastIssn || lastIssn.length === 0) {
        throw new ApiError(HttpStatus.CONFLICT, 'Could not find range information required for ISSN identifier cancellation');
      }

      if (usedIssn.issn === lastIssn[0].issn) {
        // If the used issn was last given from range, roll back counters from the range
        const rangeUpdateInfo = {
          free: range.free + 1,
          taken: range.taken - 1,
          modifiedBy: user.id
        };

        // If range was closed, open and activate it
        if (range.isClosed) {
          rangeUpdateInfo.isActive = true; // eslint-disable-line
          rangeUpdateInfo.isClosed = false; // eslint-disable-line
        }

        // If removed identifier was equal to one generated from ranges block and rangeEnd information, set rangeEnd as next value
        if (usedIssn.issn === `${range.block}-${range.rangeEnd}`) {
          rangeUpdateInfo.next = range.rangeEnd; // eslint-disable-line
        } else {
          // Otherwise calculate next value out of the issn by decreasing the base and calculating check digit
          const newNextBase = (Number(range.next.substring(0, 3)) - 1).toString().padStart(3, '0');
          const newNextCheckDigit = calculateCheckDigitIssn(`${range.block}${newNextBase}`);
          rangeUpdateInfo.next = `${newNextBase}${newNextCheckDigit}`; // eslint-disable-line
        }

        // Validate that the updated next value is generates a valid ISSN identifier
        if (!validateIssn(`${range.block}-${rangeUpdateInfo.next}`)) {
          throw new ApiError(HttpStatus.CONFLICT, 'Error occurred during attempt to update range information: newly calculated next value was invalid');
        }

        // Update range to database
        await range.update(rangeUpdateInfo, {transaction: t});
      } else {
        // If the used issn was not last given from range, generate canceled identifier entry to database
        const canceledIdentifier = {
          issn: usedIssn.issn,
          issnRangeId: usedIssn.issnRangeId,
          canceledBy: user.id
        };

        await issnCanceledModel.create(canceledIdentifier, {transaction: t});
      }

      // Remove used issn entry from database
      await usedIssn.destroy({transaction: t});

      // Update publications form
      const formUpdateInfo = {
        publicationCountIssn: form.publicationCountIssn - 1,
        modifiedBy: user.id
      };

      // Update form status if it's NOT_NOTIFIED
      if (form.status === ISSN_REGISTRY_FORM_STATUS.NOT_NOTIFIED) {
        formUpdateInfo.status = ISSN_REGISTRY_FORM_STATUS.NOT_HANDLED; // eslint-disable-line
      }

      await form.update(formUpdateInfo, {transaction: t});

      // Update publication
      const publicationUpdateInformation = {
        issn: '',
        status: ISSN_REGISTRY_PUBLICATION_STATUS.NO_PREPUBLICATION_RECORD,
        modifiedBy: user.id
      };

      const result = await publication.update(publicationUpdateInformation, {transaction: t});
      if (!result) {
        throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Unknown error occurred during database save operation. Please contact system administrator.');
      }

      // If all database entries have completed successfully, commit transaction
      await t.commit();

      return read(publicationId);
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
  /* eslint-enable max-statements,complexity,functional/no-conditional-statements */
}
