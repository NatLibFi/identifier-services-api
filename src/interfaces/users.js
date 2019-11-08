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
import {CROWD_URL, CROWD_APP_NAME, CROWD_APP_PASSWORD, PASSPORT_LOCAL_USERS, PRIVATE_KEY_URL} from '../config';

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
			if (CROWD_URL && CROWD_APP_NAME && CROWD_APP_PASSWORD) {
				const {crowdUser} = crowd();
				await crowdUser.create({doc: doc});
			} else {
				const {localUser} = local();
				await localUser.create({PASSPORT_LOCAL_USERS: PASSPORT_LOCAL_USERS, doc: doc});
			}

			const newDoc = {...doc, id: doc.email};
			const result = await userInterface.create(db, newDoc, user);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function read(db, id, user) {
		const response = await userInterface.read(db, id);
		let result;
		if (CROWD_URL && CROWD_APP_NAME && CROWD_APP_PASSWORD) {
			const {crowdUser} = crowd();
			result = await crowdUser.read({id: response.id});
		} else {
			const {localUser} = local();
			result = await localUser.read({PASSPORT_LOCAL_USERS: PASSPORT_LOCAL_USERS, email: response.email});
		}

		if (hasAdminPermission(user) || hasSystemPermission(user) || (hasPublisherAdminPermission(user) && response.publisher === user.id)) {
			return {...response, ...result};
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
		if (hasSystemPermission(user) || hasAdminPermission(user)) {
			const response = await userInterface.read(db, id);
			if (CROWD_URL && CROWD_APP_NAME && CROWD_APP_PASSWORD) {
				const {crowdUser} = crowd();
				await crowdUser.remove({id: response.id, role: response.role});
			} else {
				const {localUser} = local();
				await localUser.remove({PASSPORT_LOCAL_USERS: PASSPORT_LOCAL_USERS, id: response.id});
			}

			const result = await userInterface.remove(db, id);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function changePwd(doc, user) {
		if (doc.newPassword) {
			if (hasAdminPermission(user) || hasSystemPermission(user)) {
				if (CROWD_URL && CROWD_APP_NAME && CROWD_APP_PASSWORD) {
					const {crowdUser} = crowd();
					await crowdUser.update({doc});
				}

				const {localUser} = local();
				await localUser.update({PASSPORT_LOCAL_USERS: PASSPORT_LOCAL_USERS, user: doc});
			} else {
				throw new ApiError(HttpStatus.FORBIDDEN);
			}
		} else {
			const result = await createLinkAndSendEmail({request: doc, PRIVATE_KEY_URL: PRIVATE_KEY_URL, PASSPORT_LOCAL_USERS: PASSPORT_LOCAL_USERS});
			if (result !== undefined && result.status === 404) {
				throw new ApiError(HttpStatus.NOT_FOUND);
			}

			return result;
		}
	}

	async function query(db, {queries, offset}, user) {
		let response;
		if (CROWD_URL && CROWD_APP_NAME && CROWD_APP_PASSWORD) {
			const {crowdUser} = crowd();
			response = await crowdUser.query();
		} else {
			const {localUser} = local();
			response = await localUser.query({PASSPORT_LOCAL_USERS: PASSPORT_LOCAL_USERS});
		}

		const dbResponse = await userInterface.query(db, {queries, offset});
		if (hasAdminPermission(user) || hasSystemPermission(user)) {
			const results = dbResponse.results.filter(item => response.includes(item.userId) && item);
			return {...dbResponse, queryDocCount: results.length, results: results};
		}

		if (hasPublisherAdminPermission(user)) {
			const results = dbResponse.results.filter(item => {
				if (response.includes(item.userId) && item.publisher === user.id) {
					return item;
				}

				return null;
			});
			return {...dbResponse, queryDocCount: results.length, results: results};
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}
}
