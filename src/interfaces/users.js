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

import {hasAdminPermission, hasSystemPermission, hasPublisherAdminPermission, createLinkAndSendEmail, local, crowd} from './utils';
import interfaceFactory from './interfaceModules';
import {PASSPORT_LOCAL, PRIVATE_KEY_URL} from '../config';

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
		if (hasSystemPermission(user)) {
			if (PASSPORT_LOCAL) {
				const {localUser} = local();
				await localUser.create({PASSPORT_LOCAL: PASSPORT_LOCAL, doc: doc});
			} else {
				const {crowdUser} = crowd();
				await crowdUser.create({doc: doc});
			}

			const newDoc = {...doc, id: doc.email};
			const result = await userInterface.create(db, newDoc, user);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function read(db, id, user) {
		const result = await userInterface.read(db, id);
		const {localUser} = local();
		const localResult = await localUser.read({PASSPORT_LOCAL: PASSPORT_LOCAL, email: result.email});
		if (hasAdminPermission(user) || (hasPublisherAdminPermission(user) && result.publisher === user.id)) {
			return {...result, ...localResult};
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function update(db, id, doc, user) {
		if (hasSystemPermission(user)) {
			const result = await userInterface.update(db, id, doc, user);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function remove(db, id, user) {
		if (hasSystemPermission(user)) {
			const result = await userInterface.remove(db, id);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function changePwd(doc, user) {
		if (doc.newPassword) {
			if (hasAdminPermission(user) || hasSystemPermission(user)) {
				if (PASSPORT_LOCAL) {
					const {localUser} = local();
					return localUser.update({PASSPORT_LOCAL: PASSPORT_LOCAL, user: doc});
				}

				const {crowdUser} = crowd();
				await crowdUser.update({doc});
			} else {
				throw new ApiError(HttpStatus.FORBIDDEN);
			}
		} else {
			const result = await createLinkAndSendEmail({request: doc, PRIVATE_KEY_URL: PRIVATE_KEY_URL, PASSPORT_LOCAL: PASSPORT_LOCAL});
			if (result !== undefined && result.status === 404) {
				throw new ApiError(HttpStatus.NOT_FOUND);
			}

			return result;
		}
	}

	async function query(db, {queries, offset}, user) {
		const result = await userInterface.query(db, {queries, offset});
		if (hasAdminPermission(user) || hasSystemPermission(user)) {
			return result;
		}

		if (hasPublisherAdminPermission(user)) {
			return result.results.filter(item => item.publisher === user.id);
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}
}
