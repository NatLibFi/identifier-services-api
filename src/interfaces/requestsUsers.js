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

import {ApiError} from '@natlibfi/identifier-services-commons';

export default function () {
	return {
		createRequest,
		readRequest,
		updateRequest,
		removeRequest,
		queryRequest
	};

	async function createRequest(userProvider, doc, user) {
		try {
			return userProvider.createRequest(doc, user);
		} catch (err) {
			throw new ApiError(err.status);
		}
	}

	async function readRequest(userProvider, id, user) {
		try {
			return userProvider.readRequest(id, user);
		} catch (err) {
			throw new ApiError(err.status);
		}
	}

	async function updateRequest(userProvider, id, doc, user) {
		try {
			return userProvider.updateRequest(id, doc, user);
		} catch (err) {
			throw new ApiError(err.status);
		}
	}

	async function removeRequest(userProvider, id, user) {
		try {
			return userProvider.removeRequest(id, user);
		} catch (err) {
			throw new ApiError(err.status);
		}
	}

	async function queryRequest(userProvider, doc, user) {
		try {
			return userProvider.queryRequest(doc, user);
		} catch (err) {
			throw new ApiError(err.status);
		}
	}
}

