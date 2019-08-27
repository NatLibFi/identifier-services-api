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
import {hasAdminPermission, hasSystemPermission, hasPublisherAdminPermission} from './utils';

const userInterface = interfaceFactory('usersRequest', 'UserRequestContent');

export default function () {
	return {
		createRequest,
		readRequest,
		updateRequest,
		removeRequest,
		queryRequest
	};

	async function createRequest(db, doc, user) {
		const result = await userInterface.create(db, doc, user);
		return result;
	}

	async function readRequest(db, id, user) {
		const protectedProperties = {_id: 0};
		const result = await userInterface.read(db, id, protectedProperties);
		if (hasAdminPermission(user) || hasSystemPermission(user)) {
			return result;
		}

		if (hasPublisherAdminPermission(user) && result.publisher === user.id) {
			delete result.state;
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function updateRequest(db, id, doc, user) {
		const readResult = await readRequest(db, id, user);
		if (hasAdminPermission(user) || hasSystemPermission(user)) {
			const result = await userInterface.update(db, id, doc, user);
			return result;
		}

		if (hasPublisherAdminPermission(user) && readResult.publisher === user.id) {
			const result = await userInterface.update(db, id, doc, user);
			delete result.state;
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function removeRequest(db, id, user) {
		if (hasSystemPermission(user)) {
			const result = await userInterface.remove(db, id);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function queryRequest(db, {queries, offset}, user) {
		const result = await userInterface.query(db, {queries, offset});
		if (hasAdminPermission(user) || hasSystemPermission(user)) {
			return result;
		}

		if (hasPublisherAdminPermission(user)) {
			return result.results.filter(item => item.publisher === user.id && delete item.state);
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}
}

