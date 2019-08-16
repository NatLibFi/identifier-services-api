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

import {hasAdminPermission, hasSystemPermission, hasPublisherAdminPermission} from './utils';
import interfaceFactory from './interfaceModules';

const userInterface = interfaceFactory('userMetadata', 'UserContent');

export default function () {
	return {
		create,
		read,
		update,
		remove,
		changePwd,
		query
	};

	async function create(db, doc, user) {
		if (hasAdminPermission(user)) {
			const result = await userInterface.create(db, doc, user);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function read(db, id, user) {
		const result = await userInterface.read(db, id);
		if (hasAdminPermission(user) || (hasPublisherAdminPermission(user) && result.publisher === user.id)) {
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function update(db, id, doc, user) {
		if (hasAdminPermission(user)) {
			const result = await userInterface.update(db, id, doc, user);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function remove(db, id, user) {
		if (hasAdminPermission(user)) {
			const result = await userInterface.remove(db, id);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function changePwd(user) {
		if (hasAdminPermission(user) || hasSystemPermission(user)) {
			return null;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function query(db, {queries, offset}, user) {
		const result = await userInterface.query(db, {queries, offset});
		if (hasAdminPermission(user)) {
			return result;
		}

		if (hasPublisherAdminPermission(user)) {
			return result.results.filter(item => item.publisher === user.id);
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}
}

