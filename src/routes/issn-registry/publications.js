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
  validateUpdatePublicationIssn,
  validateIssnPublicationQueryBody,
  validateRequestId
} from '../validations';

import {issnPublicationFactory} from '../../interfaces';

export default function (permissionMiddleware) {
  const issnPublications = issnPublicationFactory();

  return new Router()
    .get('/:id', permissionMiddleware('issnPublications', 'read'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), read)
    .put('/:id', permissionMiddleware('issnPublications', 'update'), celebrate({
      [Segments.PARAMS]: validateRequestId,
      [Segments.BODY]: validateUpdatePublicationIssn
    }), update)
    .delete('/:id', permissionMiddleware('issnPublications', 'delete'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), remove)
    .post('/:id/get-issn', permissionMiddleware('issnIdentifiers', 'create'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), getIssn)
    .post('/:id/delete-issn', permissionMiddleware('issnIdentifiers', 'delete'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), deleteIssn)
    .get('/:id/get-archive-entry', permissionMiddleware('issnPublications', 'read'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), readArchiveEntry)
    .post('/query', permissionMiddleware('issnPublications', 'read'), celebrate({
      [Segments.BODY]: validateIssnPublicationQueryBody
    }), query);

  async function read(req, res, next) {
    try {
      const result = await issnPublications.read(req.params.id);

      if (result) {
        return res.status(HttpStatus.OK).json(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function readArchiveEntry(req, res, next) {
    try {
      const result = await issnPublications.readArchiveEntry(req.params.id);

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
      const result = await issnPublications.update(req.params.id, req.body, req.user);

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
      const result = await issnPublications.remove(req.params.id, req.user);

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
      const result = await issnPublications.query(req.body);

      if (result) {
        return res.status(HttpStatus.OK).json(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function getIssn(req, res, next) {
    try {
      const result = await issnPublications.getIssn(req.params.id, req.user);

      if (result) {
        return res.status(HttpStatus.OK).json(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function deleteIssn(req, res, next) {
    try {
      const result = await issnPublications.deleteIssn(req.params.id, req.user);

      if (result) {
        return res.status(HttpStatus.OK).json(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }
}
