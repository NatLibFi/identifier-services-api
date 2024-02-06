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

import {validateRequestId, validateIsbnPublisherQueryBody, validatePublisherAutocompleteBody, validateIsbnRegistryPublisherEmailDownloadQueryBody, validateIsbnRegistryPublisherGetInformationPackageQueryBody} from '../validations';

import {publishersIsbnFactory} from '../../interfaces';

export default function (permissionMiddleware) {

  const publishers = publishersIsbnFactory();

  return new Router()
    .get('/:id', permissionMiddleware('publishers', 'read'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), read)
    .post('/query', permissionMiddleware('publishers', 'query'), celebrate({
      [Segments.BODY]: validateIsbnPublisherQueryBody
    }), query)
    .post('/autocomplete', permissionMiddleware('publishers', 'autocomplete'), celebrate({
      [Segments.BODY]: validatePublisherAutocompleteBody
    }), autocomplete)
    .post('/download-email-list', permissionMiddleware('publishers', 'downloadEmails'), celebrate({
      [Segments.BODY]: validateIsbnRegistryPublisherEmailDownloadQueryBody
    }), downloadEmailList)
    .post('/get-information-package', permissionMiddleware('publishers', 'getInformationPackage'), celebrate({
      [Segments.BODY]: validateIsbnRegistryPublisherGetInformationPackageQueryBody
    }), getInformationPackage)
    .put('/:id', permissionMiddleware('publishers', 'update'), celebrate({
      [Segments.PARAMS]: validateRequestId
    }), update);

  async function read(req, res, next) {
    try {
      const result = await publishers.read(req.params.id, req.user);

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
      const result = await publishers.update(req.params.id, req.body, req.user);

      if (result) {
        return res.status(HttpStatus.OK).json(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function query(req, res, next) {
    try {
      const result = await publishers.query(req.body, req.user);

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
      const result = await publishers.autoComplete(req.body);

      if (result) {
        return res.status(HttpStatus.OK).json(result);
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function downloadEmailList(req, res, next) {
    try {
      const result = await publishers.getEmailList(req.body, req.user);

      if (result) {
        if (req.body.format === 'txt') {
          const formattedResult = result.reduce((prev, cur) => {
            if (prev === '') {
              return cur;
            }

            return `${prev}\r\n${cur}`;
          }, '');

          return res.status(HttpStatus.OK).attachment('isbn-registry-publisher-emails.txt').send(formattedResult);
        }

        if (req.body.format === 'json') {
          return res.status(HttpStatus.OK).json({data: result});
        }

        throw new Error('Unsupported format');
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }

  async function getInformationPackage(req, res, next) {
    try {
      const {publisherId, format} = req.body;
      const result = await publishers.getInformationPackage(publisherId, req.user, format);

      if (result) {
        if (req.body.format === 'xlsx') {
          return result.write(`isbn-registry-publisher.${req.body.id}-information-package.xlsx`, res);
        }

        if (req.body.format === 'json') {
          return res.status(HttpStatus.OK).json({data: result});
        }

        throw new Error('Unsupported format');
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    } catch (error) {
      return next(error);
    }
  }
}
