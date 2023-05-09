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

import HttpStatus from 'http-status';

import {permissions} from './permissions';
import {ApiError, mapGroupToRole} from '../utils';

/**
 * Combines user role with other user information based on the configuration given to API via env
 * and moves to next.
 * @param {*} req Request (express)
 * @param {*} res Response (express)
 * @param {*} next Next (express)
 */
export function combineUserInfo(req, res, next) {
  if (req.user && req.user.groups) { // eslint-disable-line
    const role = mapGroupToRole(req.user.groups);
    req.user = {...req.user, role}; // eslint-disable-line require-atomic-updates, functional/immutable-data
  }

  return next();
}

/**
 * Returns generator for middleware which passes request to passportmiddleware if it contains authorization header
 * @param {*} passportMiddlewares Authorization middleware to pass the request to
 */
export function generateUserAuthorizationMiddleware(passportMiddlewares) {
  return (req, res, next) => {
    if ('authorization' in req.headers) {
      return passportMiddlewares.token(req, res, next);
    }
    return next();
  };
}

/**
 * Returns generator for permission middleware which investigates whether user has access
 * to required resource
 */
export function generatePermissionMiddleware() {
  return (type, command) => (req, res, next) => {
    // Not allowed to access commands/types that are not defined
    if (!Object.keys(permissions).includes(type) || !Object.keys(permissions[type]).includes(command)) {
      throw new ApiError();
    }

    const commandPermissions = permissions[type][command];

    // If command is available for everyone, continue to next
    if (commandPermissions.includes('all')) {
      return next();
    }

    // If command has restrictions regarding user roles, user definition from earlier middleware is required
    if (!req.user) {
      throw new ApiError(HttpStatus.UNAUTHORIZED);
    }

    const permitted = commandPermissions.some(role => req.user.role === role);

    // If user does not have permissions to command/type an error is thrown
    if (!permitted) {
      throw new ApiError(HttpStatus.FORBIDDEN);
    }

    next();
  };
}
