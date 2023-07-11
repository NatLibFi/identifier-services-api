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
import {celebrate, Segments} from 'celebrate';
import HttpStatus from 'http-status';

import {
  validateCreateMessageType,
  validateUpdateMessageType,
  validateRequestId
} from '../validations';

import {messageTypeFactory} from '../../interfaces';

export default function (permissionMiddleware, registry) {

  const messageTypes = messageTypeFactory(registry);

  return new Router()
    .get('/', permissionMiddleware('messageType', 'read'), readAll)
    .post('/', permissionMiddleware('messageType', 'create'), celebrate({
      [Segments.BODY]: validateCreateMessageType
    }), create)
    .get('/:id', permissionMiddleware('messageType', 'read'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), read)
    .put('/:id', permissionMiddleware('messageType', 'update'), celebrate({
      [Segments.PARAMS]: validateRequestId,
      [Segments.BODY]: validateUpdateMessageType
    }), update)
    .delete('/:id', permissionMiddleware('messageType', 'delete'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), remove);

  async function create(req, res, next) {
    try {
      const result = await messageTypes.create(req.body, req.user);

      if (result) {
        return res.status(HttpStatus.CREATED).json({id: result.id});
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function read(req, res, next) {
    try {
      const result = await messageTypes.read(req.params.id);

      if (result) {
        return res.status(HttpStatus.OK).json(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function readAll(req, res, next) {
    try {
      const result = await messageTypes.readAll();

      if (result) {
        return res.status(HttpStatus.OK).json(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function update(req, res, next) {
    try {
      const result = await messageTypes.update(req.params.id, req.body, req.user);

      if (result) {
        return res.status(HttpStatus.OK).json(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function remove(req, res, next) {
    try {
      const result = await messageTypes.remove(req.params.id);

      if (result) {
        return res.status(HttpStatus.NO_CONTENT).end();
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }
}
