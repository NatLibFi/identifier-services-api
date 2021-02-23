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
    .post('/query', bodyParse(), queryRanges)
    .get('/range/:id', readRange)
    .post('/range/:id', bodyParse(), updateRange)
    .post('/query/subRange', bodyParse(), querySubRanges)
    .get('/subRange/:id', readSubRange)
    .post('/subRange', bodyParse(), createSubRange)
    .post('/query/isbnIsmnBatch', bodyParse(), queryRangesIsbnIsmnBatch)
    .post('/isbnIsmnBatch', bodyParse(), createRangesIsbnIsmnBatch)
    .get('/identifier/:id', readRangesIdentifier)
    .post('/query/identifier', bodyParse(), queryRangesIdentifier)
    .post('/', bodyParse(), createIsbnIsmn)
    .post('/isbn-ismn/queryMonthlyStatistics', bodyParse(), queryIsbnIsmnMonthlyStatistics)
    .post('/isbn-ismn/queryIsbnIsmnStatistics', bodyParse(), queryIsbnIsmnStatistics)

    .post('/issn', bodyParse(), createIssn)
    .get('/issn/:id', readIssn)
    .put('/issn/:id', bodyParse(), updateIssn)
    .post('/issn/query', bodyParse(), queryIssn)
    .post('/issn/queryStatistics', bodyParse(), queryIssnStatistics)
    .post('/issn/assignRange', bodyParse(), assignIssnRange);

  async function queryRanges(req, res, next) {
    try {
      const result = await ranges.queryRanges(db, req.body, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function readRange(req, res, next) {
    const {id} = req.params;
    try {
      const result = await ranges.readRange(db, id, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function updateRange(req, res, next) {
    const {id} = req.params;
    try {
      const result = await ranges.updateRange(db, id, req.body, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function querySubRanges(req, res, next) {
    try {
      const result = await ranges.querySubRanges(db, req.body, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function readSubRange(req, res, next) {
    const {id} = req.params;
    try {
      const result = await ranges.readSubRange(db, id, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function createSubRange(req, res, next) {
    try {
      const result = await ranges.createSubRange(db, req.body, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }


  async function queryRangesIsbnIsmnBatch(req, res, next) {
    try {
      const result = await ranges.queryRangesIsbnIsmnBatch(db, req.body, req.user);
      res.json(result);
    } catch (err) {
      return next(err);
    }
  }

  async function createRangesIsbnIsmnBatch(req, res, next) {
    try {
      const result = await ranges.createRangesIsbnIsmnBatch(db, req.body, req.user);
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

  async function createIsbnIsmn(req, res, next) {
    try {
      if (Object.keys(req.body).length === 0 && req.body.constructor === Object) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(HttpStatus.BAD_REQUEST);
      }
      const result = await ranges.createIsbnIsmn(db, req.body, req.user);
      res.status(HttpStatus.CREATED).json(result);
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
      const result = await ranges.queryIsbnIsmnStatistics(db, req.user);
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
