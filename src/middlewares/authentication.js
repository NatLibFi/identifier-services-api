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
import {ApiError, getRolesFromKeycloakRoles} from '../utils';

/**
 * Returns generator for middleware which passes request to passportmiddleware if it contains authorization header
 * @param {*} passportMiddlewares Authorization middleware to pass the request to
 */
export function generateUserAuthorizationMiddleware(passportMiddlewares) {
  return (req, res, next) => {
    if ('authorization' in req.headers) {
      return passportMiddlewares.token(req, res, next);
    }
    throw new ApiError(HttpStatus.UNAUTHORIZED);
  };
}

/**
 * Getter for user application roles. Requires the request user to exist and have some application role.
 * @returns Next if user has some application role, otherwise throws ApiError with unauthorized status
 */
export function getUserApplicationRoles(req, res, next) {
  if (!req.user || !req.user.roles || !Array.isArray(req.user.roles)) {
    throw new ApiError(HttpStatus.UNAUTHORIZED);
  }

  const userApplicationRoles = getRolesFromKeycloakRoles(req.user.roles);
  req.user.applicationRoles = userApplicationRoles;
  return next();
}

/**
 * Returns generator for permission middleware which investigates whether user has access
 * to required resource
 */
export function generatePermissionMiddleware() {
  return (type, command) => (req, res, next) => {
    // Do not evaluate further if user is not defined, public endpoints do not utilize permission middleware
    if (!req.user) {
      throw new ApiError(HttpStatus.UNAUTHORIZED);
    }

    // Not allowed to access commands/types that are not defined
    if (!Object.keys(permissions).includes(type) || !Object.keys(permissions[type]).includes(command)) {
      throw new ApiError();
    }

    const commandPermissions = permissions[type][command];
    const endpointIsPublic = commandPermissions.includes('all');

    if (endpointIsPublic) {
      return next();
    }

    // If endpoint was not public and user is not defined, return unauthorized
    if (!req.user.applicationRoles) {
      throw new ApiError(HttpStatus.UNAUTHORIZED);
    }

    const permitted = commandPermissions.some(role => req.user.applicationRoles.includes(role));

    // If authenticated user does not have permissions to endpoint/command, return forbidden
    if (!permitted) {
      throw new ApiError(HttpStatus.FORBIDDEN);
    }

    next();
  };
}
