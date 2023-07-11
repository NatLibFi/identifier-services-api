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

import {validateCreateRangeIssn, validateRequestId} from '../validations';

import {issnRangeFactory} from '../../interfaces';

export default function (permissionMiddleware) {
  const issnRangeInterface = issnRangeFactory();

  return new Router()
    .get('/', permissionMiddleware('ranges', 'read'), celebrate({
      [Segments.BODY]: validateCreateRangeIssn
    }), readAll)
    .post('/', permissionMiddleware('ranges', 'create'), celebrate({
      [Segments.BODY]: validateCreateRangeIssn
    }), create)
    .get('/:id', permissionMiddleware('ranges', 'read'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), read)
    .delete('/:id', permissionMiddleware('ranges', 'delete'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), remove)
    .post('/:id/open', permissionMiddleware('ranges', 'update'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), open)
    .post('/:id/close', permissionMiddleware('ranges', 'update'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), close)
    .post('/:id/activate', permissionMiddleware('ranges', 'update'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), activate)
    .post('/:id/deactivate', permissionMiddleware('ranges', 'update'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), deactivate);

  async function create(req, res, next) {
    try {
      const result = await issnRangeInterface.create(req.body, req.user);

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
      const result = await issnRangeInterface.read(req.params.id);

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
      const result = await issnRangeInterface.remove(req.params.id);

      if (result) {
        return res.status(HttpStatus.NO_CONTENT).end();
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function readAll(req, res, next) {
    try {
      const result = await issnRangeInterface.readAll(req.params.id);

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
      const result = await issnRangeInterface.open(req.params.id, req.user);

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
      const result = await issnRangeInterface.close(req.params.id, req.user);

      if (result) {
        return res.status(HttpStatus.OK).json(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function activate(req, res, next) {
    try {
      const result = await issnRangeInterface.activate(req.params.id, req.user);

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
      const result = await issnRangeInterface.deactivate(req.params.id, req.user);

      if (result) {
        return res.status(HttpStatus.OK).json(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }
}


