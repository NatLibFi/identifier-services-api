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
  validateRequestId,
  validateGetMarcRecord
} from '../validations';

import {marcFactory} from '../../interfaces';
import {ApiError} from '../../utils';

export default function (permissionMiddleware, registry) {

  const marc = marcFactory(registry);

  return new Router()
    .get('/:id', permissionMiddleware('marc', 'read'), celebrate({
      [Segments.PARAMS]: validateRequestId,
      [Segments.QUERY]: validateGetMarcRecord
    }), getMarcRecord)
    .post('/:id/send-to-melinda', permissionMiddleware('melinda', 'create'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), sendToMelinda)
    .post('/:id/search-from-melinda', permissionMiddleware('melinda', 'read'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), searchFromMelinda);


  async function getMarcRecord(req, res, next) {
    try {
      const result = await marc.getRecord(req.params.id, req.query.format);

      if (result) {
        if (req.query.download) {
          if (req.query.format === 'iso2709') {
            return res.status(HttpStatus.OK).attachment(`isbn-registry-record-${req.params.id}.mrc`).send(result);
          }

          if (req.query.format === 'json') {
            return res.status(HttpStatus.OK).attachment(`isbn-registry-record-${req.params.id}.json`).send(result);
          }

          throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'Unsupported format for download');
        }
        return res.status(HttpStatus.OK).json(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function sendToMelinda(req, res, next) {
    try {
      const result = await marc.sendToMelinda(req.params.id);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return next(error);
    }
  }

  async function searchFromMelinda(req, res, next) {
    try {
      const result = await marc.searchFromMelinda(req.params.id);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return next(error);
    }
  }

}
