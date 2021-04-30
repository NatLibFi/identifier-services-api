/* eslint-disable max-lines */
/* eslint-disable max-statements */
/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file.
 *
 * API microservice of Identifier Services
 *
 * Copyright (C) 2019 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of identifier-services-api
 *
 * identifier-services-api program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * identifier-services-api is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 *
 */
import {Router} from 'express';
import {rangesFactory} from '../interfaces';
import {API_URL} from '../config';
import {bodyParse} from '../utils';
import HttpStatus from 'http-status';
import {ApiError} from '@natlibfi/identifier-services-commons';

export default function (db) {
  const ranges = rangesFactory({url: API_URL});

  return new Router()
    .post('/isbn', bodyParse(), createIsbn)
    .get('/range/isbn/:id', readIsbnRange)
    .post('/range/isbn/:id', bodyParse(), updateIsbnRange)
    .post('/query/isbn', bodyParse(), queryIsbnRanges)
    .post('/query/isbn/subRange', bodyParse(), queryIsbnSubRanges)
    .get('/isbn/subRange/:id', readIsbnSubRange)
    .post('/isbn/subRange', bodyParse(), createIsbnSubRange)
    .post('/query/rangebatch', bodyParse(), queryRangesBatch)
    .post('/isbnBatch', bodyParse(), createRangesIsbnBatch)
    .post('/isbn/subRange/revoke', bodyParse(), revokeIsbnSubRange)
    .post('/isbn/pickRangeList', bodyParse(), pickRangeList)

    .post('/ismn', bodyParse(), createIsmn)
    .post('/ismn/subRange', bodyParse(), createIsmnSubRange)
    .get('/ismn/subRange/:id', bodyParse(), readIsmnSubRange)
    .post('/range/ismn/:id', bodyParse(), updateIsmnRange)
    .post('/query/ismn', bodyParse(), queryIsmnRanges)
    .post('/query/ismn/subRange', bodyParse(), queryIsmnSubRanges)
    .post('/ismnBatch', bodyParse(), createRangesIsmnBatch)
    .post('/ismn/subRange/revoke', bodyParse(), revokeIsmnSubRange)

    .get('/identifier/:id', readRangesIdentifier)
    .post('/identifier/revoke', bodyParse(), revokeIdentifier)
    .post('/isbn-ismn/queryMonthlyStatistics', bodyParse(), queryIsbnIsmnMonthlyStatistics)
    .post('/isbn-ismn/queryIsbnIsmnStatistics', bodyParse(), queryIsbnIsmnStatistics)

    .post('/query/identifier', bodyParse(), queryRangesIdentifier)

    .post('/issn', bodyParse(), createIssn)
    .get('/issn/:id', readIssn)
    .put('/issn/:id', bodyParse(), updateIssn)
    .post('/issn/query', bodyParse(), queryIssn)
    .post('/issn/queryStatistics', bodyParse(), queryIssnStatistics)
    .post('/issn/assignRange', bodyParse(), assignIssnRange);

  async function queryIsbnRanges(req, res, next) {
    try {
      const result = await ranges.queryIsbnRanges(db, req.body, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function readIsbnRange(req, res, next) {
    const {id} = req.params;
    try {
      const result = await ranges.readIsbnRange(db, id, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function updateIsbnRange(req, res, next) {
    const {id} = req.params;
    try {
      const result = await ranges.updateIsbnRange(db, id, req.body, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function queryIsbnSubRanges(req, res, next) {
    try {
      const result = await ranges.queryIsbnSubRanges(db, req.body, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function readIsbnSubRange(req, res, next) {
    const {id} = req.params;
    try {
      const result = await ranges.readIsbnSubRange(db, id, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function createIsbnSubRange(req, res, next) {
    try {
      const result = await ranges.createIsbnSubRange(db, req.body, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function revokeIsbnSubRange(req, res, next) {
    try {
      const result = await ranges.revokeIsbnSubRange(db, req.body, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function pickRangeList(req, res, next) {
    try {
      const result = await ranges.pickRangeList(db, req.body, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }


  async function queryRangesBatch(req, res, next) {
    try {
      const result = await ranges.queryRangesBatch(db, req.body, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function createRangesIsbnBatch(req, res, next) {
    try {
      const result = await ranges.createRangesIsbnBatch(db, req.body, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function queryRangesIdentifier(req, res, next) {
    try {
      const result = await ranges.queryRangesIdentifier(db, req.body, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function createIsbn(req, res, next) {
    try {
      if (Object.keys(req.body).length === 0 && req.body.constructor === Object) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(HttpStatus.BAD_REQUEST);
      }
      const result = await ranges.createIsbn(db, req.body, req.user);
      res.status(HttpStatus.CREATED).json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function createIsmn(req, res, next) {
    try {
      if (Object.keys(req.body).length === 0 && req.body.constructor === Object) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(HttpStatus.BAD_REQUEST);
      }
      const result = await ranges.createIsmn(db, req.body, req.user);
      res.status(HttpStatus.CREATED).json(result);
    } catch (err) {
      return next(err);
    }
  }
  async function revokeIsmnSubRange(req, res, next) {
    try {
      const result = await ranges.revokeIsmnSubRange(db, req.body, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function updateIsmnRange(req, res, next) {
    const {id} = req.params;
    try {
      const result = await ranges.updateIsmnRange(db, id, req.body, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function createIsmnSubRange(req, res, next) {
    try {
      const result = await ranges.createIsmnSubRange(db, req.body, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function readIsmnSubRange(req, res, next) {
    const {id} = req.params;
    try {
      const result = await ranges.readIsmnSubRange(db, id, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function queryIsmnRanges(req, res, next) {
    try {
      const result = await ranges.queryIsmnRanges(db, req.body, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function queryIsmnSubRanges(req, res, next) {
    try {
      const result = await ranges.queryIsmnSubRanges(db, req.body, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function createRangesIsmnBatch(req, res, next) {
    try {
      const result = await ranges.createRangesIsmnBatch(db, req.body, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function queryIsbnIsmnMonthlyStatistics(req, res, next) {
    try {
      const result = await ranges.queryIsbnIsmnMonthlyStatistics(db, req.body, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function queryIsbnIsmnStatistics(req, res, next) {
    try {
      const result = await ranges.queryIsbnIsmnStatistics(db, req.body, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function readRangesIdentifier(req, res, next) {
    const {id} = req.params;
    try {
      const result = await ranges.readRangesIdentifier(db, id, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function revokeIdentifier(req, res, next) {
    try {
      const result = await ranges.revokeIdentifier(db, req.body, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function createIssn(req, res, next) {
    try {
      if (Object.keys(req.body).length === 0 && req.body.constructor === Object) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(HttpStatus.BAD_REQUEST);
      }
      const result = await ranges.createIssn(db, req.body, req.user);
      res.status(HttpStatus.CREATED).json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function readIssn(req, res, next) {
    const {id} = req.params;
    try {
      const result = await ranges.readIssn(db, id, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function updateIssn(req, res, next) {
    const {id} = req.params;
    try {
      const result = await ranges.updateIssn(db, id, req.body, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function queryIssn(req, res, next) {
    try {
      const result = await ranges.queryIssn(db, req.body, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function queryIssnStatistics(req, res, next) {
    try {
      const result = await ranges.queryIssnStatistics(db, req.body, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function assignIssnRange(req, res, next) {
    try {
      const result = await ranges.assignIssnRange(db, req.body, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

}
