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

export {
  validatePublisherAutocompleteBody,
  validateQueryBody,
  validateRequestId
} from './common.js';

export {
  validateCreateRangeIsbn,
  validateCreateRangeIsmn,
  validateCreateRangeIssn,
  validateCreateSubRange
} from './range/index.js';

export {
  validateCreatePublisherRequestIsbn,
  validateUpdatePublisherRequestIsbn,
  validateIsbnPublisherQueryBody,
  validateIsbnRegistryPublisherArchiveQuery,
  validateIsbnRegistryPublisherEmailDownloadQueryBody,
  validateIsbnRegistryPublisherGetInformationPackageQueryBody,
  validateCreateIssnPublisher,
  validateUpdateIssnPublisher
} from './publisher/index.js';

export {
  validateCreatePublicationRequestIsbn,
  validateCreatePublicationRequestIsbnAdmin,
  validateQueryPublicationRequestIsbn,
  validateSetPublisher,
  validateUpdatePublicationRequestIsbn,
  validateCreatePublicationIssn,
  validateUpdatePublicationIssn,
  validateIssnPublicationQueryBody
} from './publication/index.js';

export {
  validateCreateMessageTemplate,
  validateCreateMessageType,
  validateQueryMessageIsbn,
  validateQueryMessageIssn,
  validateUpdateMessageTemplate,
  validateUpdateMessageType,
  validateLoadTemplateIsbn,
  validateLoadTemplateIssn,
  validateSendMessageIsbn,
  validateSendMessageIssn,
  validateResendMessage
} from './message/index.js';

export {
  validateCreateIdentifierBatch,
  validateQueryIdentifierBatch,
  validateCancelOrRemoveIdentifier
} from './identifiers/index.js';

export {
  validateStatisticsRequestIsbn,
  validateStatisticsRequestIssn
} from './statistics/index.js';

export {
  validateCreateIssnRequest,
  validateUpdateIssnRequest,
  validateQueryIssnRequest,
  validateIssnArchiveSearch
} from './issnForm/index.js';

export {
  validateGetMarcRecord
} from './marc/index.js';
