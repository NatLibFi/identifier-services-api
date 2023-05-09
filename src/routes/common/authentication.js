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
import HttpStatus from 'http-status';

import {validateTurnstile} from '../../middlewares/turnstile';

export default function (passportMiddlewares, combineUserInfo) {
  return new Router()
    .post('/', validateTurnstile, passportMiddlewares.credentials, authenticate)
    .get('/', passportMiddlewares.token, combineUserInfo, read);

  function authenticate(req, res) {
    return res.status(HttpStatus.OK).json({authenticationToken: req.user});
  }

  function read(req, res, next) {
    try {
      if (req.user) {
        const {id, groups, ...result} = {...req.user}; // eslint-disable-line no-unused-vars
        return res.status(HttpStatus.OK).json(result);
      }

      return res.status(HttpStatus.NOT_FOUND);
    } catch (err) {
      return next(err);
    }
  }
}
