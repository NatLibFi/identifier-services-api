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

import {COMMON_REGISTRY_TYPES} from '../../interfaces/constants';

import {default as createIssnRegistryRequestRouter} from './requests';
import {default as createIssnRegistryArchivedRequestRouter} from './archived-requests';
import {default as createIssnRegistryPublisherRouter} from './publishers';
import {default as createIssnRegistryPublicationRouter} from './publications';
import {default as createIssnRegistryRangeRouter} from './ranges';
import {default as createIssnRegistryMessageRouter} from './messages';
import {default as createIssnRegistryStatisticsRouter} from './statistics';
import * as commonRoutes from '../common';

export default function (middlewares) {
  const {permissionMiddleware} = middlewares;
  return new Router()
    // ISSN RANGES
    .use('/ranges', createIssnRegistryRangeRouter(permissionMiddleware))

    // ISSN REQUESTS
    .use('/requests', createIssnRegistryRequestRouter(permissionMiddleware))

    // ISSN REQUESTS ARCHIVE
    .use('/archived-requests', createIssnRegistryArchivedRequestRouter(permissionMiddleware))

    // ISSN PUBLISHERS
    .use('/publishers', createIssnRegistryPublisherRouter(permissionMiddleware))

    // ISSN PUBLICATIONS
    .use('/publications', createIssnRegistryPublicationRouter(permissionMiddleware))

    // ISSN MESSAGES
    .use('/messagetypes', commonRoutes.createMessageTypeRouter(permissionMiddleware, COMMON_REGISTRY_TYPES.ISSN))
    .use('/messagetemplates', commonRoutes.createMessageTemplateRouter(permissionMiddleware, COMMON_REGISTRY_TYPES.ISSN))
    .use('/messages', createIssnRegistryMessageRouter(permissionMiddleware))

    // ISSN STATISTICS
    .use('/statistics', createIssnRegistryStatisticsRouter(permissionMiddleware))

    // ISSN MARC
    .use('/marc', commonRoutes.createMarcRouter(permissionMiddleware, COMMON_REGISTRY_TYPES.ISSN));
}
