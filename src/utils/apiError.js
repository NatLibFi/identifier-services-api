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

/* eslint-disable functional/no-classes,functional/no-class-inheritance */
export class ApiError extends Error {
  constructor(status, message, ...params) {
    super(status, ...params);
    this.status = status ?? HttpStatus.INTERNAL_SERVER_ERROR;

    if (status === HttpStatus.UNAUTHORIZED) {
      this.message = 'Unauthorized';
    } else if (status === HttpStatus.FORBIDDEN) {
      this.message = 'Forbidden';
    } else if (status === HttpStatus.NOT_FOUND && !message) {
      this.message = 'Not found';
    } else {
      this.message = message ?? 'Unknown error occurred';
    }
  }
}
