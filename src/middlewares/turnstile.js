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

import HttpStatus from 'http-status';

import {NODE_ENV, TURNSTILE_SECRET_KEY, TURNSTILE_URL, DISABLE_TURNSTILE} from '../config';
import {ApiError} from '../utils';
import {permissions} from './permissions';

/**
 * Validates turnstile token
 * @param {*} req Request (express)
 * @param {*} res Response (express)
 * @param {*} next Next (express)
 */
/* istanbul ignore next */
export async function validateTurnstile(req, res, next) {
  try {
    // Do not use this middleware during testing
    if (NODE_ENV === 'test' || DISABLE_TURNSTILE) {
      return next();
    }

    // If request has user with role of administrator, do not require turnstile token
    if (req.user && permissions.turnstile.skip.some(role => req.user.role === role)) {
      return next();
    }

    const {turnstileToken} = req.body;

    if (!turnstileToken) {
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY);
    }

    const formData = new FormData();
    formData.append('secret', TURNSTILE_SECRET_KEY);
    formData.append('response', turnstileToken);

    const result = await fetch(TURNSTILE_URL, {
      body: formData,
      method: 'POST'
    });

    const outcome = await result.json();
    if (outcome.success) {
      return next();
    }

    throw new ApiError(HttpStatus.FORBIDDEN, 'Forbidden');
  } catch (err) {
    return next(err);
  }
}
