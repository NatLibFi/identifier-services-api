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
  validateCreateMessageTemplate,
  validateUpdateMessageTemplate,
  validateRequestId
} from '../validations';

import {messageTemplateFactory} from '../../interfaces';

export default function (permissionMiddleware, registry) {

  const messageTemplates = messageTemplateFactory(registry);

  return new Router()
    .get('/', permissionMiddleware('messageTemplate', 'read'), readAll)
    .post('/', permissionMiddleware('messageTemplate', 'create'), celebrate({
      [Segments.BODY]: validateCreateMessageTemplate
    }), create)
    .get('/:id', permissionMiddleware('messageTemplate', 'read'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), read)
    .put('/:id', permissionMiddleware('messageTemplate', 'update'), celebrate({
      [Segments.PARAMS]: validateRequestId,
      [Segments.BODY]: validateUpdateMessageTemplate
    }), update)
    .delete('/:id', permissionMiddleware('messageTemplate', 'delete'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), remove);

  async function create(req, res, next) {
    try {
      const result = await messageTemplates.create(req.body, req.user);

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
      const result = await messageTemplates.read(req.params.id);

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
      const result = await messageTemplates.readAll();

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
      const result = await messageTemplates.update(req.params.id, req.body, req.user);

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
      const result = await messageTemplates.remove(req.params.id);

      if (result) {
        return res.status(HttpStatus.NO_CONTENT).end();
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }
}
