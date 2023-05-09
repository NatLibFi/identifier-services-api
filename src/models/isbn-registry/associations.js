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
    publicationIsbn,
    publisherIsbn,
    publisherIsbnArchiveRecord,
    isbnRange,
    isbnSubRange,
    isbnSubRangeCanceled,
    ismnRange,
    ismnSubRange,
    ismnSubRangeCanceled,
    identifier,
    identifierBatch,
    identifierCanceled,
    identifierBatchDownload,
    messageTypeIsbn,
    messageTemplateIsbn,
    messageIsbn,
    groupMessageIsbn
  } = sequelize.models;


  // ISBN REGISTRY PUBLISHER

  // Each publisher has an archive record that is not allowed to be modified
  publisherIsbn.hasOne(publisherIsbnArchiveRecord, {as: 'archiveRecord', constraints: false, foreignKey: {allowNull: false, name: 'publisherId', field: 'publisher_id'}});
  publisherIsbnArchiveRecord.belongsTo(publisherIsbn, {as: 'publisher', constraints: false, foreignKey: {allowNull: false, name: 'publisherId', field: 'publisher_id'}});

  // Publisher may have multiple ISBN subranges
  publisherIsbn.hasMany(isbnSubRange, {as: 'isbnSubRanges', constraints: false, foreignKey: {allowNull: false, name: 'publisherId', field: 'publisher_id'}});
  isbnSubRange.belongsTo(publisherIsbn, {as: 'publisher', constraints: false, foreignKey: {allowNull: false, name: 'publisherId', field: 'publisher_id'}});

  // Publisher may have multiple ISMN subranges
  publisherIsbn.hasMany(ismnSubRange, {as: 'ismnSubRanges', constraints: false, foreignKey: {allowNull: false, name: 'publisherId', field: 'publisher_id'}});
  ismnSubRange.belongsTo(publisherIsbn, {as: 'publisher', constraints: false, foreignKey: {allowNull: false, name: 'publisherId', field: 'publisher_id'}});

  // Publisher may have multiple Identifier Batch
  publisherIsbn.hasMany(identifierBatch, {as: 'identifierBatches', constraints: false, foreignKey: {allowNull: false, name: 'publisherId', field: 'publisher_id'}});
  identifierBatch.belongsTo(publisherIsbn, {as: 'publisher', constraints: false, foreignKey: {allowNull: false, name: 'publisherId', field: 'publisher_id'}});

  // Publisher may have multiple canceled Identifiers
  publisherIsbn.hasMany(identifierCanceled, {as: 'canceledIdentifiers', constraints: false, foreignKey: {allowNull: false, name: 'publisherId', field: 'publisher_id'}});
  identifierCanceled.belongsTo(publisherIsbn, {as: 'publisher', constraints: false, foreignKey: {allowNull: false, name: 'publisherId', field: 'publisher_id'}});

  // Publisher may have multiple publications
  publisherIsbn.hasMany(publicationIsbn, {as: 'publications', constraints: false, foreignKey: {name: 'publisherId', field: 'publisher_id'}});
  publicationIsbn.belongsTo(publisherIsbn, {as: 'publisher', constraints: false, foreignKey: {name: 'publisherId', field: 'publisher_id'}});

  // Publisher may have been sent many messages
  publisherIsbn.hasMany(messageIsbn, {as: 'messages', constraints: false, foreignKey: {name: 'publisherId', field: 'publisher_id'}});
  messageIsbn.belongsTo(publisherIsbn, {as: 'publisher', constraints: false, foreignKey: {name: 'publisherId', field: 'publisher_id'}});


  // ISBN REGISTRY RANGE

  // ISBN range may have multiple ISBN subranges
  isbnRange.hasMany(isbnSubRange, {as: 'isbnSubRanges', constraints: false, foreignKey: {allowNull: false, name: 'isbnRangeId', field: 'isbn_range_id'}});
  isbnSubRange.belongsTo(isbnRange, {as: 'isbnRange', constraints: false, foreignKey: {allowNull: false, name: 'isbnRangeId', field: 'isbn_range_id'}});

  // ISBN range may have multiple canceled ISBN subranges
  isbnRange.hasMany(isbnSubRangeCanceled, {as: 'canceledIsbnSubRanges', constraints: false, foreignKey: {allowNull: false, name: 'rangeId', field: 'range_id', onDelete: 'cascade'}});
  isbnSubRangeCanceled.belongsTo(isbnRange, {as: 'isbnRange', constraints: false, foreignKey: {allowNull: false, name: 'rangeId', field: 'range_id'}});


  // ISMN REGISTRY RANGE

  // ISMN range may have multiple ISMN subranges
  ismnRange.hasMany(ismnSubRange, {as: 'ismnSubRanges', constraints: false, foreignKey: {allowNull: false, name: 'ismnRangeId', field: 'ismn_range_id'}});
  ismnSubRange.belongsTo(ismnRange, {as: 'ismnRange', constraints: false, foreignKey: {allowNull: false, name: 'ismnRangeId', field: 'ismn_range_id'}});

  // ISMN range may have multiple canceled ISMN subranges
  ismnRange.hasMany(ismnSubRangeCanceled, {as: 'canceledIsmnSubRanges', constraints: false, foreignKey: {allowNull: false, name: 'rangeId', field: 'range_id'}});
  ismnSubRangeCanceled.belongsTo(ismnRange, {as: 'ismnRange', constraints: false, foreignKey: {allowNull: false, name: 'rangeId', field: 'range_id'}});


  // ISBN REGISTRY IDENTIFIER BATCH

  // Identifier batch has multiple identifiers
  identifierBatch.hasMany(identifier, {as: 'identifiers', constraints: false, foreignKey: {allowNull: false, name: 'identifierBatchId', field: 'identifier_batch_id'}});
  identifier.belongsTo(identifierBatch, {as: 'identifierBatch', constraints: false, foreignKey: {allowNull: false, name: 'identifierBatchId', field: 'identifier_batch_id'}});

  // Identifier batch is linked to messages
  identifierBatch.hasMany(messageIsbn, {as: 'messages', constraints: false, foreignKey: {name: 'batchId', field: 'batch_id'}});
  messageIsbn.belongsTo(identifierBatch, {as: 'identifierBatch', constraints: false, foreignKey: {name: 'batchId', field: 'batch_id'}});

  // ISBN REGISTRY PUBLICATION

  // Publication has one (or many?) identifier batch
  publicationIsbn.hasOne(identifierBatch, {as: 'identifierBatch', constraints: false, foreignKey: {allowNull: false, name: 'publicationId', field: 'publication_id'}});
  identifierBatch.belongsTo(publicationIsbn, {as: 'publication', constraints: false, foreignKey: {allowNull: false, name: 'publicationId', field: 'publication_id'}});

  // Publication may be linked to multiple messages
  publicationIsbn.hasMany(messageIsbn, {as: 'messages', constraints: false, foreignKey: {name: 'publicationId', field: 'publication_id'}});
  messageIsbn.belongsTo(publicationIsbn, {as: 'publication', constraints: false, foreignKey: {name: 'publicationId', field: 'publication_id'}});


  // ISBN REGISTRY MESSAGE TYPE
  messageTypeIsbn.hasMany(messageTemplateIsbn, {as: 'messageTemplates', constraints: false, foreignKey: {name: 'messageTypeId', field: 'message_type_id'}});
  messageTemplateIsbn.belongsTo(messageTypeIsbn, {as: 'messageType', constraints: false, foreignKey: {name: 'messageTypeId', field: 'message_type_id'}});

  messageTypeIsbn.hasMany(messageIsbn, {as: 'messages', constraints: false, foreignKey: {name: 'messageTypeId', field: 'message_type_id'}});
  messageIsbn.belongsTo(messageTypeIsbn, {as: 'messageType', constraints: false, foreignKey: {name: 'messageTypeId', field: 'message_type_id'}});

  messageTypeIsbn.hasMany(groupMessageIsbn, {as: 'groupMessages', constraints: false, foreignKey: {allowNull: false, name: 'messageTypeId', field: 'message_type_id'}});
  groupMessageIsbn.belongsTo(messageTypeIsbn, {as: 'messageType', constraints: false, foreignKey: {allowNull: false, name: 'messageTypeId', field: 'message_type_id'}});

  // ISBN REGISTRY MESSAGE TEMPLATE
  messageTemplateIsbn.hasMany(messageIsbn, {as: 'messages', constraints: false, foreignKey: {name: 'messageTemplateId', field: 'message_template_id'}});
  messageIsbn.belongsTo(messageTemplateIsbn, {as: 'messageTemplate', constraints: false, foreignKey: {name: 'messageTemplateId', field: 'message_template_id'}});

  // ISBN REGISTRY GROUP MESSAGES
  groupMessageIsbn.hasMany(messageIsbn, {as: 'messages', constraints: false, foreignKey: {allowNull: false, name: 'groupMessageId', field: 'group_message_id'}});
  messageIsbn.belongsTo(groupMessageIsbn, {as: 'groupMessage', constraints: false, foreignKey: {allowNull: false, name: 'groupMessageId', field: 'group_message_id'}});

  // (DEV) - Keeping track of downloading identifier batches
  identifierBatch.hasMany(identifierBatchDownload, {as: 'downloads', constraints: false, foreignKey: {name: 'batchId', field: 'batch_id'}});
  identifierBatchDownload.belongsTo(identifierBatch, {as: 'identifierBatch', constraints: false, foreignKey: {name: 'batchId', field: 'batch_id'}});
}
