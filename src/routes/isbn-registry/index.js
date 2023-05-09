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

import {Router} from 'express';

import {COMMON_IDENTIFIER_TYPES, COMMON_REGISTRY_TYPES} from '../../interfaces/constants';

import {default as createIsbnRegistryPublisherRangeRouter} from './publisher-ranges';
import {default as createIsbnRegistryRangeRouter} from './ranges';
import {default as createIsbnRegistryIdentifierBatchRouter} from './identifierBatches';
import {default as createIsbnRegistryIdentifierRouter} from './identifiers';
import {default as createIsbnRegistryPublisherRouter} from './publishers';
import {default as createIsbnRegistryPublisherArchiveRouter} from './publisher-archives';
import {default as createIsbnRegistryPublisherRequestRouter} from './requests/publishers';
import {default as createIsbnRegistryPublicationRequestRouter} from './requests/publications';
import {default as createIsbnRegistryMessageRouter} from './messages';
import {default as createIsbnRegistryStatisticsRouter} from './statistics';
import * as commonRoutes from '../common';

export default function (middlewares) {
  const {gatherUserInformationMiddlewares, permissionMiddleware} = middlewares;
  return new Router()
    // ISBN RANGES
    .use('/ranges/isbn', gatherUserInformationMiddlewares, createIsbnRegistryRangeRouter(permissionMiddleware, COMMON_IDENTIFIER_TYPES.ISBN))
    .use('/publisher-ranges/isbn', gatherUserInformationMiddlewares, createIsbnRegistryPublisherRangeRouter(permissionMiddleware, COMMON_IDENTIFIER_TYPES.ISBN))

    // ISMN RANGES
    .use('/ranges/ismn', gatherUserInformationMiddlewares, createIsbnRegistryRangeRouter(permissionMiddleware, COMMON_IDENTIFIER_TYPES.ISMN))
    .use('/publisher-ranges/ismn', gatherUserInformationMiddlewares, createIsbnRegistryPublisherRangeRouter(permissionMiddleware, COMMON_IDENTIFIER_TYPES.ISMN))

    // ISBN PUBLISHERS
    .use('/publishers', gatherUserInformationMiddlewares, createIsbnRegistryPublisherRouter(permissionMiddleware))
    .use('/publisher-archives', gatherUserInformationMiddlewares, createIsbnRegistryPublisherArchiveRouter(permissionMiddleware))

    // REQUESTS
    .use('/requests/publishers', gatherUserInformationMiddlewares, createIsbnRegistryPublisherRequestRouter(permissionMiddleware))
    .use('/requests/publications', gatherUserInformationMiddlewares, createIsbnRegistryPublicationRequestRouter(permissionMiddleware))

    // IDENTIFIERS
    .use('/identifierbatches', gatherUserInformationMiddlewares, createIsbnRegistryIdentifierBatchRouter(permissionMiddleware))
    .use('/identifiers', gatherUserInformationMiddlewares, createIsbnRegistryIdentifierRouter(permissionMiddleware))

    // MESSAGES
    .use('/messagetypes', gatherUserInformationMiddlewares, commonRoutes.createMessageTypeRouter(permissionMiddleware, COMMON_REGISTRY_TYPES.ISBN_ISMN))
    .use('/messagetemplates', gatherUserInformationMiddlewares, commonRoutes.createMessageTemplateRouter(permissionMiddleware, COMMON_REGISTRY_TYPES.ISBN_ISMN))
    .use('/messages', gatherUserInformationMiddlewares, createIsbnRegistryMessageRouter(permissionMiddleware))

    // STATISTICS
    .use('/statistics', gatherUserInformationMiddlewares, createIsbnRegistryStatisticsRouter(permissionMiddleware))

    // MARC
    .use('/marc', gatherUserInformationMiddlewares, commonRoutes.createMarcRouter(permissionMiddleware, COMMON_REGISTRY_TYPES.ISBN_ISMN));
}
