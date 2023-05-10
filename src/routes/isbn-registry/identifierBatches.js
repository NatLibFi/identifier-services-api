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
  validateCreateIdentifierBatch,
  validateQueryIdentifierBatch,
  validateRequestId
} from '../validations';

import {validateTurnstile} from '../../middlewares/turnstile';
import {identifierBatchesFactory, subRangesFactory} from '../../interfaces';
import {COMMON_IDENTIFIER_TYPES} from '../../interfaces/constants';

export default function (permissionMiddleware) {

  const isbnSubRanges = subRangesFactory(COMMON_IDENTIFIER_TYPES.ISBN);
  const ismnSubRanges = subRangesFactory(COMMON_IDENTIFIER_TYPES.ISMN);
  const identifierBatches = identifierBatchesFactory();

  return new Router()
    .get('/:id', celebrate({
      [Segments.PARAMS]: validateRequestId
    }), read)
    .delete('/:id', permissionMiddleware('identifierBatches', 'delete'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), remove)
    .post('/:id/download', validateTurnstile, celebrate({
      [Segments.PARAMS]: validateRequestId
    }), download)
    .post('/query', permissionMiddleware('identifierBatches', 'query'), celebrate({
      [Segments.BODY]: validateQueryIdentifierBatch
    }), query)
    .post('/isbn', permissionMiddleware('identifierBatches', 'create'), celebrate({
      [Segments.BODY]: validateCreateIdentifierBatch
    }), createIsbn)
    .post('/ismn', permissionMiddleware('identifierBatches', 'create'), celebrate({
      [Segments.BODY]: validateCreateIdentifierBatch
    }), createIsmn);

  async function read(req, res, next) {
    try {
      const result = await identifierBatches.read(req.params.id, req.user);

      if (result) {
        return res.status(HttpStatus.OK).json(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  // Note: removing batch means always that the previous state of the identifiers linked to the batch will be restored.
  // In practice this means that the identifiers are available for reuse.
  async function remove(req, res, next) {
    try {
      const result = await identifierBatches.safeRemove(req.params.id, req.user);

      if (result) {
        return res.status(HttpStatus.NO_CONTENT).end();
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function download(req, res, next) {
    try {
      const result = await identifierBatches.download(req.params.id, req.user);

      if (result) {
        res.attachment(`identifierBatch-${req.params.id}.txt`); // njsscan-ignore: express_xss
        return res.send(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function createIsbn(req, res, next) {
    try {
      const {publisherId, count, publicationId} = req.body;
      const result = await isbnSubRanges.generateIdentifierBatchWrapper(publisherId, count, publicationId, req.user);

      if (result) {
        return res.status(HttpStatus.CREATED).json({id: result.id});
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function createIsmn(req, res, next) {
    try {
      const {publisherId, count, publicationId} = req.body;
      const result = await ismnSubRanges.generateIdentifierBatchWrapper(publisherId, count, publicationId, req.user);

      if (result) {
        return res.status(HttpStatus.CREATED).json({id: result.id});
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function query(req, res, next) {
    try {
      const result = await identifierBatches.query(req.body);

      if (result) {
        return res.status(HttpStatus.OK).json(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }
}


