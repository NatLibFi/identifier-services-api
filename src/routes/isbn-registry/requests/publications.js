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
  validateCreatePublicationRequestIsbn,
  validateUpdatePublicationRequestIsbn,
  validateSetPublisher,
  validateQueryPublicationRequestIsbn,
  validateRequestId
} from '../../validations';

import {publicationRequestIsbnFactory} from '../../../interfaces';
import {validateTurnstile} from '../../../middlewares/turnstile';

export default function (permissionMiddleware) {

  const publicationRequests = publicationRequestIsbnFactory();

  return new Router()
    .post('/', validateTurnstile, celebrate({
      [Segments.BODY]: validateCreatePublicationRequestIsbn
    }), create)
    .get('/:id', permissionMiddleware('publicationRequests', 'read'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), read)
    .delete('/:id', permissionMiddleware('publicationRequests', 'delete'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), remove)
    .put('/:id', permissionMiddleware('publicationRequests', 'update'), celebrate({
      [Segments.PARAMS]: validateRequestId,
      [Segments.BODY]: validateUpdatePublicationRequestIsbn
    }), update)
    .put('/:id/set-publisher', permissionMiddleware('publicationRequests', 'update'), celebrate({
      [Segments.PARAMS]: validateRequestId,
      [Segments.BODY]: validateSetPublisher
    }), setPublisher)
    .post('/:id/copy', permissionMiddleware('publicationRequests', 'copy'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), copy)
    .post('/query', permissionMiddleware('publicationRequests', 'read'), celebrate({
      [Segments.BODY]: validateQueryPublicationRequestIsbn
    }), query);

  async function create(req, res, next) {
    try {
      const result = await publicationRequests.create(req.body, req.user);
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
      const result = await publicationRequests.read(req.params.id);

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
      const result = await publicationRequests.update(req.params.id, req.body, req.user);

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
      const result = await publicationRequests.remove(req.params.id);

      if (result) {
        return res.status(HttpStatus.NO_CONTENT).end();
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function query(req, res, next) {
    try {
      const result = await publicationRequests.query(req.body);

      if (result) {
        return res.status(HttpStatus.OK).json(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function setPublisher(req, res, next) {
    try {
      const result = await publicationRequests.setPublisher(req.params.id, req.body.publisherId, req.user);

      if (result) {
        return res.status(HttpStatus.OK).json(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function copy(req, res, next) {
    try {
      const result = await publicationRequests.copy(req.params.id, req.user);

      if (result) {
        return res.status(HttpStatus.CREATED).json({id: result.id});
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }
}
