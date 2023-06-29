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
  validateCreateIssnPublisher,
  validateUpdateIssnPublisher,
  validateQueryBody,
  validateRequestId
} from '../validations';

import {issnPublisherFactory} from '../../interfaces';

export default function (permissionMiddleware) {
  const issnPublishers = issnPublisherFactory();

  return new Router()
    .post('/', permissionMiddleware('issnPublishers', 'create'), celebrate({
      [Segments.BODY]: validateCreateIssnPublisher
    }), create)
    .get('/:id', permissionMiddleware('issnPublishers', 'read'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), read)
    .put('/:id', permissionMiddleware('issnPublishers', 'update'), celebrate({
      [Segments.PARAMS]: validateRequestId,
      [Segments.BODY]: validateUpdateIssnPublisher
    }), update)
    .delete('/:id', permissionMiddleware('issnPublishers', 'delete'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), remove)
    .post('/autocomplete', permissionMiddleware('issnPublishers', 'autocomplete'), celebrate({
      [Segments.BODY]: validateQueryBody
    }), autocomplete)
    .post('/query', permissionMiddleware('issnPublishers', 'read'), celebrate({
      [Segments.BODY]: validateQueryBody
    }), query);

  async function create(req, res, next) {
    try {
      const result = await issnPublishers.create(req.body, req.user);
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
      const result = await issnPublishers.read(req.params.id);

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
      const result = await issnPublishers.update(req.params.id, req.body, req.user);

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
      const result = await issnPublishers.remove(req.params.id);

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
      const result = await issnPublishers.query(req.body);

      if (result) {
        return res.status(HttpStatus.OK).json(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function autocomplete(req, res, next) {
    try {
      const result = await issnPublishers.autoComplete(req.body);

      if (result) {
        return res.status(HttpStatus.OK).json(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }
}
