/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file.
 *
 * API microservice of Melinda record batch import system
 *
 * Copyright (C) 2018-2019 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of melinda-record-import-api
 *
 * melinda-record-import-api program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * melinda-record-import-api is distributed in the hope that it will be useful,
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

import interfaceFactory from './interfaceModules';
import {hasPermission, validateDoc} from './utils';
import {ApiError} from '@natlibfi/identifier-services-commons';
import HttpStatus from 'http-status';
import {validate} from '@natlibfi/identifier-services-commons/dist/validate';

const rangesISBNInterface = interfaceFactory('RangeIsbnContent', 'RangeIsbnContent');
const rangesISMNInterface = interfaceFactory('RangeIsmnContent', 'RangeIsmnContent');
const rangesISSNInterface = interfaceFactory('RangeIssnContent');

export default function () {
	return {
		createIsbn,
		readIsbn,
		updateIsbn,
		queryIsbn,
		createIsmn,
		readIsmn,
		updateIsmn,
		queryIsmn,
		createIssn,
		readIssn,
		updateIssn,
		queryIssn
	};

	async function createIsbn(db, doc, user) {
		try {
			if (validateDoc(doc, 'RangeIsbnContent')) {
				if (hasPermission(user, 'ranges', 'createIsbn')) {
					return rangesISBNInterface.create(db, doc, user);
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

	async function readIsbn(db, id, user) {
		try {
			if (hasPermission(user, 'ranges', 'readIsbn')) {
				const result = await rangesISBNInterface.read(db, id);
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

	async function updateIsbn(db, id, doc, user) {
		try {
			if (Object.keys(doc).length === 0) {
				throw new ApiError(HttpStatus.BAD_REQUEST);
			}

			if (validate(doc, 'RangeIsbnContent')) {
				if (hasPermission(user, 'ranges', 'updateIsbn')) {
					return rangesISBNInterface.update(db, id, doc, user);
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

	async function queryIsbn(db, {queries, offset}, user) {
		try {
			if (hasPermission(user, 'ranges', 'queryIsbn')) {
				const result = await rangesISBNInterface.query(db, {queries, offset});
				return result;
			}

			throw new ApiError(HttpStatus.FORBIDDEN);
		} catch (err) {
			if (err) {
				throw new ApiError(err.status);
			}
		}
	}

	async function createIsmn(db, doc, user) {
		try {
			if (validateDoc(doc, 'RangeIsmnContent')) {
				if (hasPermission(user, 'ranges', 'createIsmn')) {
					return rangesISMNInterface.create(db, doc, user);
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

	async function readIsmn(db, id, user) {
		try {
			if (hasPermission(user, 'ranges', 'readIsmn')) {
				const result = await rangesISMNInterface.read(db, id);
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

	async function updateIsmn(db, id, doc, user) {
		try {
			if (Object.keys(doc).length === 0) {
				throw new ApiError(HttpStatus.BAD_REQUEST);
			}

			if (validateDoc(doc, 'RangeIsmnContent')) {
				if (hasPermission(user, 'ranges', 'updateIsmn')) {
					return rangesISMNInterface.update(db, id, doc, user);
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

	async function queryIsmn(db, {queries, offset}, user) {
		try {
			if (hasPermission(user, 'ranges', 'queryIsmn')) {
				return rangesISMNInterface.query(db, {queries, offset});
			}

			throw new ApiError(HttpStatus.FORBIDDEN);
		} catch (err) {
			if (err) {
				throw new ApiError(err.status);
			}
		}
	}

	async function createIssn(db, doc, user) {
		try {
			if (validateDoc(doc, 'RangeIssnContent')) {
				if (hasPermission(user, 'ranges', 'createIssn')) {
					const result = await rangesISSNInterface.create(db, doc, user);
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

	async function readIssn(db, id, user) {
		try {
			if (hasPermission(user, 'ranges', 'readIssn')) {
				const result = await rangesISSNInterface.read(db, id);
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

	async function updateIssn(db, id, doc, user) {
		try {
			if (Object.keys(doc).length === 0) {
				throw new ApiError(HttpStatus.BAD_REQUEST);
			}

			if (validateDoc(doc, 'RangeIsmnContent')) {
				if (hasPermission(user, 'ranges', 'updateIssn')) {
					return rangesISSNInterface.update(db, id, doc, user);
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

	async function queryIssn(db, {queries, offset}, user) {
		try {
			if (hasPermission(user, 'ranges', 'queryIssn')) {
				return rangesISSNInterface.query(db, {queries, offset});
			}

			throw new ApiError(HttpStatus.FORBIDDEN);
		} catch (err) {
			if (err) {
				throw new ApiError(err.status);
			}
		}
	}
}
