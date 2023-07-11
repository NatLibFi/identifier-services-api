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
  validateCreateIssnRequest,
  validateUpdateIssnRequest,
  validateQueryIssnRequest,
  validateRequestId,
  validateSetPublisher,
  validateCreatePublicationIssn
} from '../validations';

import {issnRequestFactory, issnPublicationFactory} from '../../interfaces';

export default function (permissionMiddleware) {
  const issnRequests = issnRequestFactory();
  const issnPublications = issnPublicationFactory();

  return new Router()
    .post('/', permissionMiddleware('issnRequests', 'create'), celebrate({
      [Segments.BODY]: validateCreateIssnRequest
    }), create)
    .get('/:id', permissionMiddleware('issnRequests', 'read'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), read)
    .put('/:id', permissionMiddleware('issnRequests', 'update'), celebrate({
      [Segments.PARAMS]: validateRequestId,
      [Segments.BODY]: validateUpdateIssnRequest
    }), update)
    .delete('/:id', permissionMiddleware('issnRequests', 'delete'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), remove)
    .put('/:id/set-publisher', permissionMiddleware('issnRequests', 'update'), celebrate({
      [Segments.PARAMS]: validateRequestId,
      [Segments.BODY]: validateSetPublisher
    }), setPublisher)
    .post('/:id/add-publisher', permissionMiddleware('issnPublishers', 'create'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), addPublisher)
    .post('/:id/add-publication', permissionMiddleware('issnPublications', 'create'), celebrate({
      [Segments.PARAMS]: validateRequestId,
      [Segments.BODY]: validateCreatePublicationIssn
    }), addPublication)
    .get('/:id/get-archive-record', permissionMiddleware('issnRequests', 'read'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), getArchiveRecord)
    .post('/query', permissionMiddleware('issnRequests', 'read'), celebrate({
      [Segments.BODY]: validateQueryIssnRequest
    }), query);

  async function create(req, res, next) {
    try {
      const result = await issnRequests.create(req.body, req.user);
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
      const result = await issnRequests.read(req.params.id);

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
      const result = await issnRequests.update(req.params.id, req.body, req.user);

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
      const result = await issnRequests.remove(req.params.id);

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
      const result = await issnRequests.query(req.body);

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
      const result = await issnRequests.setPublisher(req.params.id, req.body, req.user);

      if (result) {
        return res.status(HttpStatus.OK).json(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function addPublisher(req, res, next) {
    try {
      const result = await issnRequests.addPublisher(req.params.id, req.user);

      if (result) {
        return res.status(HttpStatus.CREATED).json({id: result.id});
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function addPublication(req, res, next) {
    try {
      const result = await issnPublications.create(req.params.id, req.body, req.user);

      if (result) {
        return res.status(HttpStatus.CREATED).json({id: result.id});
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function getArchiveRecord(req, res, next) {
    try {
      const result = await issnRequests.getArchiveRecord(req.params.id);

      if (result) {
        return res.status(HttpStatus.OK).json(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }
}
