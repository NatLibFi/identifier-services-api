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

import HttpStatus from 'http-status';
import {ApiError} from '@natlibfi/identifier-services-commons';

import interfaceFactory from './interfaceModules';
import {hasPermission, validateDoc} from './utils';

const templateInterface = interfaceFactory('MessageTemplate', 'MessageTemplateContent');

export default function () {
	return {
		create,
		read,
		update,
		remove,
		query
	};

	async function create(db, doc, user) {
		try {
			if (Object.keys(doc).length === 0) {
				throw new ApiError(HttpStatus.BAD_REQUEST);
			}

			if (validateDoc(doc, 'MessageTemplateContent')) {
				if (hasPermission(user, 'messageTemplates', 'create')) {
					const result = await templateInterface.create(db, doc, user);
					return result;
				}

				throw new ApiError(HttpStatus.FORBIDDEN);
			} else {
				throw new ApiError(HttpStatus.BAD_REQUEST);
			}
		} catch (err) {
			if (err) {
				throw new ApiError(err.status ? err.status : HttpStatus.BAD_REQUEST);
			}
		}
	}

	async function read(db, id, user) {
		try {
			if (hasPermission(user, 'messageTemplates', 'read')) {
				const result = await templateInterface.read(db, id);
				if (result === null) {
					throw new ApiError(HttpStatus.NOT_FOUND);
				}

				return result;
			}

			throw new ApiError(HttpStatus.FORBIDDEN);
		} catch (err) {
			if (err) {
				throw new ApiError(err.status);
			}
		}
	}

	async function update(db, id, doc, user) {
		try {
			if (Object.keys(doc).length === 0) {
				throw new ApiError(HttpStatus.BAD_REQUEST);
			} else if (validateDoc(doc, 'MessageTemplateContent')) {
				if (hasPermission(user, 'messageTemplates', 'update')) {
					const result = await templateInterface.update(db, id, doc, user);
					return result;
				}

				throw new ApiError(HttpStatus.FORBIDDEN);
			}

			throw new ApiError(HttpStatus.BAD_REQUEST);
		} catch (err) {
			if (err) {
				throw new ApiError(err.status ? err.status : HttpStatus.BAD_REQUEST);
			}
		}
	}

	async function remove(db, id, user) {
		if (hasPermission(user, 'messageTemplates', 'remove')) {
			const result = await templateInterface.remove(db, id);
			if (result.value === null) {
				throw new ApiError(HttpStatus.NOT_FOUND);
			}

			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function query(db, {queries, offset}, user) {
		try {
			if (hasPermission(user, 'messageTemplates', 'query')) {
				const result = await templateInterface.query(db, {queries, offset});
				if (result.results.length === 0) {
					throw new ApiError(HttpStatus.NOT_FOUND);
				}

				return result;
			}

			throw new ApiError(HttpStatus.FORBIDDEN);
		} catch (err) {
			if (err) {
				throw new ApiError(err.status);
			}
		}
	}
}
