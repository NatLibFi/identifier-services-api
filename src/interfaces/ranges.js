/* eslint-disable no-shadow-restricted-names */
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
import {hasAdminPermission} from './utils';
import {ApiError} from '@natlibfi/identifier-services-commons';
import HttpStatus from 'http-status';

const rangesISBNInterface = interfaceFactory('IdentifierRangesISBN', 'RangeIsbnContent');
const rangesISMNInterface = interfaceFactory('IdentifierRangesISMN', 'RangeIsmnContent');
const rangesISSNInterface = interfaceFactory('IdentifierRangesISSN', 'RangeIssnContent');

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
		if (hasAdminPermission(user)) {
			const result = await rangesISBNInterface.create(db, doc, user);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function readIsbn(db, id, user) {
		if (hasAdminPermission(user)) {
			const result = await rangesISBNInterface.read(db, id, user);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function updateIsbn(db, id, doc, user) {
		if (hasAdminPermission(user)) {
			const result = await rangesISBNInterface.update(db, id, doc, user);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function queryIsbn(db, {query, offset}, user) {
		if (hasAdminPermission(user)) {
			const result = await rangesISBNInterface.query(db, {query, offset});
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function createIsmn(db, doc, user) {
		if (hasAdminPermission(user)) {
			const result = await rangesISMNInterface.create(db, doc, user);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function readIsmn(db, id, user) {
		if (hasAdminPermission(user)) {
			const result = await rangesISMNInterface.read(db, id, user);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function updateIsmn(db, id, doc, user) {
		if (hasAdminPermission(user)) {
			const result = await rangesISMNInterface.update(db, id, doc, user);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function queryIsmn(db, {query, offset}, user) {
		if (hasAdminPermission(user)) {
			const result = await rangesISMNInterface.query(db, {query, offset});
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function createIssn(db, doc, user) {
		if (hasAdminPermission(user)) {
			const result = await rangesISSNInterface.create(db, doc, user);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function readIssn(db, id, user) {
		if (hasAdminPermission(user)) {
			const result = await rangesISMNInterface.read(db, id, user);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function updateIssn(db, id, doc, user) {
		if (hasAdminPermission(user)) {
			const result = await rangesISSNInterface.update(db, id, doc, user);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function queryIssn(db, {query, offset}, user) {
		if (hasAdminPermission(user)) {
			const result = await rangesISSNInterface.query(db, {query, offset});
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}
}
