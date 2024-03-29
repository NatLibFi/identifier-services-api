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

import validateContentType from '@natlibfi/express-validate-content-type';
import bodyParser from 'body-parser';

import {createLogger, createExpressLogger} from '@natlibfi/melinda-backend-commons';

import {ENABLE_PROXY, PROXY_CUSTOM_HEADER, ROLE_MAP} from '../config';

export {ApiError} from './apiError';

export function bodyParse() {
  validateContentType({
    type: ['application/json']
  });
  return bodyParser.json({
    type: ['application/json']
  });
}

export function getRolesFromKeycloakRoles(userKeycloakRoles) {
  return Object.entries(ROLE_MAP).reduce((prev, [applicationRole, keycloakRoles]) => {
    if (userKeycloakRoles.some(role => keycloakRoles.includes(role))) {
      return [...prev, applicationRole];
    }

    return prev;
  }, []);
}

export function isAdmin(user) {
  return hasRequiredProperties(user) && hasAdminRole(user);

  function hasRequiredProperties(user) {
    const requiredProperties = ['id', 'applicationRoles'];
    return user && typeof user === 'object' && requiredProperties.every(property => Object.keys(user).includes(property)) && typeof user.id === 'string' && user.id.length > 0;
  }

  function hasAdminRole(user) {
    const adminRoles = ['admin', 'system'];
    return adminRoles.some(role => user.applicationRoles.includes(role));
  }
}

export function getExpressLogger() {
  const logger = createLogger();

  if (!ENABLE_PROXY || !PROXY_CUSTOM_HEADER) {
    logger.info('Using basic melinda backend commons logger');
    return createExpressLogger();
  }

  logger.info('Logger is parsing origin IP from custom header');
  const msg = `{{req.headers["${PROXY_CUSTOM_HEADER}"]}} HTTP {{req.method}} {{req.path}} - {{res.statusCode}} {{res.responseTime}}ms`;
  return createExpressLogger({msg});
}

// Function parseBoolean defined below this comment is part of melinda-commons-js package and has the following license file associated to it:
/*
MIT License

Copyright (c) 2018-present University Of Helsinki (The National Library Of Finland)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

export function parseBoolean(value) {
  if (value === undefined) {
    return false;
  }

  if (Number.isNaN(Number(value))) {
    return value.length > 0 && !(/^(?:false)$/ui).test(value);
  }

  return Boolean(Number(value));
}

