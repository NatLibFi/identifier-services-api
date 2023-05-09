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

import {validateRequestId, validateCreateRangeIsbn, validateCreateRangeIsmn} from '../validations';

import {rangesFactory} from '../../interfaces';
import {COMMON_IDENTIFIER_TYPES} from '../../interfaces/constants';

export default function (permissionMiddleware, identifierType) {
  const rangesInterface = rangesFactory(identifierType);
  const validations = getValidations(identifierType);

  return new Router()
    .get('/', permissionMiddleware('ranges', 'read'), readAll)
    .post('/', permissionMiddleware('ranges', 'create'), celebrate({
      [Segments.BODY]: validations.create
    }), create)
    .get('/:id/publisher-range-options', permissionMiddleware('ranges', 'read'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), getSubrangeOptions)
    .post('/:id/activate', permissionMiddleware('ranges', 'update'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), activate)
    .post('/:id/deactivate', permissionMiddleware('ranges', 'update'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), deactivate)
    .post('/:id/close', permissionMiddleware('ranges', 'update'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), close)
    .post('/:id/open', permissionMiddleware('ranges', 'update'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), open)
    .get('/:id', permissionMiddleware('ranges', 'read'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), read)
    .delete('/:id', permissionMiddleware('ranges', 'delete'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), remove);

  function getValidations(identifierType) {
    if (identifierType === COMMON_IDENTIFIER_TYPES.ISBN) {
      return {
        create: validateCreateRangeIsbn
      };
    }

    if (identifierType === COMMON_IDENTIFIER_TYPES.ISMN) {
      return {
        create: validateCreateRangeIsmn
      };
    }

    return {};
  }

  async function create(req, res, next) {
    try {
      const result = await rangesInterface.create(req.body, req.user);

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
      const result = await rangesInterface.read(req.params.id);

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
      const result = await rangesInterface.readAll();

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
      const result = await rangesInterface.remove(req.params.id);

      if (result) {
        return res.status(HttpStatus.NO_CONTENT).end();
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function activate(req, res, next) {
    try {
      const result = await rangesInterface.activate(req.params.id, req.user);

      if (result) {
        return res.status(HttpStatus.OK).json(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function deactivate(req, res, next) {
    try {
      const result = await rangesInterface.deactivate(req.params.id, req.user);

      if (result) {
        return res.status(HttpStatus.OK).json(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function close(req, res, next) {
    try {
      const result = await rangesInterface.close(req.params.id, req.user);

      if (result) {
        return res.status(HttpStatus.OK).json(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function open(req, res, next) {
    try {
      const result = await rangesInterface.open(req.params.id, req.user);

      if (result) {
        return res.status(HttpStatus.OK).json(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function getSubrangeOptions(req, res, next) {
    try {
      const result = await rangesInterface.subrangeOptions(req.params.id);

      if (result) {
        return res.status(HttpStatus.OK).json(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

}


