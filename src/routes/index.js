/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file.
 *
 * API microservice of Identifier Services
 *
 * Copyright (C) 2019 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of identifier-services-api
 *
 * identifier-services-api program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * identifier-services-api is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 *
 */

export {default as createUsersRouter} from './users';
export {default as createRequestsUsersRouter} from './requestsUsers';
export {default as createPublishersRouter} from './publishers';
export {default as createPublishersRequestsRouter} from './requestsPublishers';
export {default as createPublicationsRouterIsbnIsmn} from './publications/isbnIsmn';
export {default as createRequestsPublicationsRouterIsbnIsmn} from './publications/requestsIsbnIsmn';
export {default as createPublicationsRouterIssn} from './publications/issn';
export {default as createRequestsPublicationsRouterIssn} from './publications/requestsIssn';
export {default as createMessageTemplate} from './messageTemplates';
export {default as createRangesRouter} from './ranges';
export {default as createApiDocRouter} from './api-doc';
export {default as authenticationRouter} from './authentication';
