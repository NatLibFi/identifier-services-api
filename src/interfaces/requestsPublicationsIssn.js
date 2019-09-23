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

import {hasAdminPermission, hasSystemPermission, filterResult} from './utils';
import interfaceFactory from './interfaceModules';

const publicationsRequestsIssnInterface = interfaceFactory('PublicationRequest_ISSN', 'PublicationIssnRequestContent');

export default function () {
	return {
		createRequestISSN,
		readRequestISSN,
		updateRequestISSN,
		removeRequestISSN,
		queryRequestISSN
	};

	async function createRequestISSN(db, doc, user) {
		if (hasSystemPermission(user)) {
			const result = await publicationsRequestsIssnInterface.create(db, doc, user);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function readRequestISSN(db, id, user) {
		const result = await publicationsRequestsIssnInterface.read(db, id);
		if (hasAdminPermission(user) || hasSystemPermission(user)) {
			return result;
		}

		if (user && result.publisher === user.id) {
			return filterResult(result);
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function updateRequestISSN(db, id, doc, user) {
		const readResult = await readRequestISSN(db, id, user);
		if (hasAdminPermission(user) || hasSystemPermission(user)) {
			const result = await publicationsRequestsIssnInterface.update(db, id, doc, user);
			return result;
		}

		if (user && readResult.publisher === user.id) {
			const result = await publicationsRequestsIssnInterface.update(db, id, doc, user);
			return filterResult(result);
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function removeRequestISSN(db, id, user) {
		if (hasSystemPermission(user)) {
			const result = await publicationsRequestsIssnInterface.remove(db, id);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function queryRequestISSN(db, {queries, offset}, user) {
		const result = await publicationsRequestsIssnInterface.query(db, {queries, offset});
		if (hasAdminPermission(user) || hasSystemPermission(user)) {
			return result;
		}

		if (user) {
			return result.results.filter(item => item.publisher === user.id && filterResult(item));
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}
}
