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
  validateStatisticsRequestIssn
} from '../validations';

import {statisticsIssnFactory} from '../../interfaces';
import {ApiError} from '../../utils';

export default function (permissionMiddleware) {

  const statistics = statisticsIssnFactory();

  return new Router()
    .post('/', permissionMiddleware('statistics', 'read'), celebrate({
      [Segments.BODY]: validateStatisticsRequestIssn
    }), getStatistics);


  async function getStatistics(req, res, next) {
    try {
      const result = await statistics.getStatistics(req.body);

      if (result) {
        if (req.body.format !== 'json') {
          const formattedResult = await statistics.formatStatistics(req.body.format, result, req.body.type);

          // For xlsx setting content type explicitly
          if (req.body.format === 'xlsx') {
            return formattedResult.write(`issn-registry-statistics.${req.body.format}`, res);
          }

          if (req.body.format === 'csv') {
            return res.attachment('isbn-registry-statistics.csv').send(formattedResult);
          }

          throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, 'Unsupported statistics format');
        }

        // Defaults to JSON if format was not defined
        return res.status(HttpStatus.OK).json(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

}
