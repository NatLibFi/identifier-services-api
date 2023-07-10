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

import {validateTurnstile} from '../../middlewares/turnstile';

import {
  validateRequestId,
  validateCreatePublisherRequestIsbn,
  validateCreatePublicationRequestIsbn,
  validateQueryBody
} from '../validations';

import {
  identifierBatchesFactory,
  publishersIsbnFactory,
  publisherRequestIsbnFactory,
  publicationRequestIsbnFactory
} from '../../interfaces';

export default function () {
  const publishers = publishersIsbnFactory();
  const identifierBatches = identifierBatchesFactory();
  const publicationRequests = publicationRequestIsbnFactory();
  const publisherRequests = publisherRequestIsbnFactory();

  return new Router()
    // Requests
    .post('/requests/publishers', validateTurnstile, celebrate({
      [Segments.BODY]: validateCreatePublisherRequestIsbn
    }), createPublisherRequest)
    .post('/requests/publications', validateTurnstile, celebrate({
      [Segments.BODY]: validateCreatePublicationRequestIsbn
    }), createPublicationRequest)

    // Publisher registry
    .get('/publishers/:id', celebrate({
      [Segments.PARAMS]: validateRequestId
    }), readPublisherPublic)
    .post('/publishers/query', celebrate({
      [Segments.PARAMS]: validateQueryBody
    }), queryPublisherPublic)

    // Identifier batches
    .get('/identifierbatches/:id', celebrate({
      [Segments.PARAMS]: validateRequestId
    }), readIdentifierbatchPublic)
    .post('/identifierbatches/:id/download', validateTurnstile, celebrate({
      [Segments.PARAMS]: validateRequestId
    }), downloadIdentifierbatch);


  async function createPublicationRequest(req, res, next) {
    try {
      const result = await publicationRequests.create(req.body);
      if (result) {
        return res.status(HttpStatus.CREATED).json({id: result.id});
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function createPublisherRequest(req, res, next) {
    try {
      const result = await publisherRequests.create(req.body);
      if (result) {
        return res.status(HttpStatus.CREATED).json({id: result.id});
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function readPublisherPublic(req, res, next) {
    try {
      const result = await publishers.readPublic(req.params.id);

      if (result) {
        return res.status(HttpStatus.OK).json(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function queryPublisherPublic(req, res, next) {
    try {
      const result = await publishers.queryPublic(req.body);

      if (result) {
        return res.status(HttpStatus.OK).json(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function readIdentifierbatchPublic(req, res, next) {
    try {
      const result = await identifierBatches.readPublic(req.params.id);

      if (result) {
        return res.status(HttpStatus.OK).json(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function downloadIdentifierbatch(req, res, next) {
    try {
      const result = await identifierBatches.download(req.params.id);

      if (result) {
        res.attachment(`identifierBatch-${req.params.id}.txt`); // njsscan-ignore: express_xss
        return res.send(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }
}
