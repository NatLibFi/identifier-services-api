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

export default function (sequelize) {
  const {
    issnForm,
    issnFormArchive,
    issnUsed,
    issnCanceled,
    messageIssn,
    messageTypeIssn,
    messageTemplateIssn,
    publicationIssn,
    publicationIssnArchive,
    publisherIssn,
    issnRange
  } = sequelize.models;

  // ISSN Form
  publisherIssn.hasMany(issnForm, {as: 'issnForm', constraints: false, foreignKey: {name: 'publisherId', field: 'publisher_id'}});
  issnForm.belongsTo(publisherIssn, {as: 'publisherIssn', constraints: false, foreignKey: {name: 'publisherId', field: 'publisher_id'}});

  issnForm.hasOne(publisherIssn, {as: 'createdFromForm', constraints: false, foreignKey: {name: 'formId', field: 'form_id'}});
  publisherIssn.belongsTo(issnForm, {as: 'createdPublisher', constraints: false, foreignKey: {name: 'formId', field: 'form_id'}});

  // ISSN Form Archive
  issnForm.hasOne(issnFormArchive, {as: 'issnFormArchive', constraints: false, foreignKey: {allowNull: false, name: 'formId', field: 'form_id'}});
  issnFormArchive.belongsTo(issnForm, {as: 'issnForm', constraints: false, foreignKey: {allowNull: false, name: 'formId', field: 'form_id'}});

  // ISSN Publication
  issnForm.hasMany(publicationIssn, {as: 'publicationIssn', constraints: false, foreignKey: {name: 'formId', field: 'form_id'}});
  publicationIssn.belongsTo(issnForm, {as: 'issnForm', constraints: false, foreignKey: {name: 'formId', field: 'form_id'}});

  publisherIssn.hasMany(publicationIssn, {as: 'publication', constraints: false, foreignKey: {name: 'publisherId', field: 'publisher_id'}});
  publicationIssn.belongsTo(publisherIssn, {as: 'publisher', constraints: false, foreignKey: {name: 'publisherId', field: 'publisher_id'}});

  // ISSN Publication Archive
  publicationIssn.hasOne(publicationIssnArchive, {as: 'publicationIssnArchive', constraints: false, foreignKey: {allowNull: false, name: 'publicationId', field: 'publication_id'}});
  publicationIssnArchive.belongsTo(publicationIssn, {as: 'publicationIssn', constraints: false, foreignKey: {allowNull: false, name: 'publicationId', field: 'publication_id'}});

  issnForm.hasMany(publicationIssnArchive, {as: 'publicationIssnArchive', constraints: false, foreignKey: {name: 'formId', field: 'form_id'}});
  publicationIssnArchive.belongsTo(issnForm, {as: 'issnForm', constraints: false, foreignKey: {name: 'formId', field: 'form_id'}});

  // ISSN identifiers
  publicationIssn.hasOne(issnUsed, {as: 'issnUsed', constraints: false, foreignKey: {allowNull: false, name: 'publicationId', field: 'publication_id'}});
  issnUsed.belongsTo(publicationIssn, {as: 'publicationIssn', constraints: false, foreignKey: {allowNull: false, name: 'publicationId', field: 'publication_id'}});

  issnRange.hasMany(issnUsed, {as: 'issnUsed', constraints: false, foreignKey: {allowNull: false, name: 'issnRangeId', field: 'issn_range_id'}});
  issnUsed.belongsTo(issnRange, {as: 'issnRange', constraints: false, foreignKey: {allowNull: false, name: 'issnRangeId', field: 'issn_range_id'}});

  // ISSN canceled
  issnRange.hasMany(issnCanceled, {as: 'issnCanceled', constraints: false, foreignKey: {allowNull: false, name: 'issnRangeId', field: 'issn_range_id'}});
  issnCanceled.belongsTo(issnRange, {as: 'issnRange', constraints: false, foreignKey: {allowNull: false, name: 'issnRangeId', field: 'issn_range_id'}});

  // ISSN Message template
  messageTypeIssn.hasMany(messageTemplateIssn, {as: 'messageTemplateIssn', constraints: false, foreignKey: {name: 'messageTypeId', field: 'message_type_id'}});
  messageTemplateIssn.belongsTo(messageTypeIssn, {as: 'messageTypeIssn', constraints: false, foreignKey: {name: 'messageTypeId', field: 'message_type_id'}});

  // ISSN Message
  messageTypeIssn.hasMany(messageIssn, {as: 'messageIssn', constraints: false, foreignKey: {name: 'messageTypeId', field: 'message_type_id'}});
  messageIssn.belongsTo(messageTypeIssn, {as: 'messageTypeIssn', constraints: false, foreignKey: {name: 'messageTypeId', field: 'message_type_id'}});

  messageTemplateIssn.hasMany(messageIssn, {as: 'messageIssn', constraints: false, foreignKey: {name: 'messageTemplateId', field: 'message_template_id'}});
  messageIssn.belongsTo(messageTemplateIssn, {as: 'messageTemplateIssn', constraints: false, foreignKey: {name: 'messageTemplateId', field: 'message_template_id'}});

  publisherIssn.hasMany(messageIssn, {as: 'messageIssn', constraints: false, foreignKey: {name: 'publisherId', field: 'publisher_id'}});
  messageIssn.belongsTo(publisherIssn, {as: 'publisherIssn', constraints: false, foreignKey: {name: 'publisherId', field: 'publisher_id'}});

  issnForm.hasMany(messageIssn, {as: 'messageIssn', constraints: false, foreignKey: {name: 'formId', field: 'form_id'}});
  messageIssn.belongsTo(issnForm, {as: 'issnForm', constraints: false, foreignKey: {name: 'formId', field: 'form_id'}});
}
