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

const userInterface = interfaceFactory('usersRequest');

export default function () {
	return {
		createRequest,
		readRequest,
		updateRequest,
		removeRequest,
		queryRequest
	};

	async function createRequest(db, doc, user) {
		if (hasPermission(user, 'userRequests', 'createRequest')) {
			const newDoc = {
				...doc,
				state: 'new',
				backgroundProcessingState: 'pending',
				preferences: {
					defaultLanguage: 'fin'
				},
				role: 'publisher',
				userId: doc.SSOId ? doc.SSOId : doc.email,
				publisher: user._id.toString()
			};
			validateDoc(newDoc, 'UserRequestContent');
			const result = await userInterface.create(db, newDoc, user);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function readRequest(db, id, user) {
		let protectedProperties = user.role === 'publisher-admin' ? {_id: 0, state: 0} : {_id: 0};
		const result = await userInterface.read(db, id, protectedProperties);
		if (hasPermission(user, 'userRequests', 'readRequest')) {
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function updateRequest(db, id, doc, user) {
		const newDoc = {...doc, backgroundProcessingState: doc.backgroundProcessingState ? doc.backgroundProcessingState : 'pending'};
		if (newDoc.initialRequest) {
			validateDoc(newDoc, 'UserRequestContent');
		} else {
			validateDoc(newDoc, 'UserRequest');
		}

		if (hasPermission(user, 'userRequests', 'updateRequest')) {
			const result = await userInterface.update(db, id, newDoc, user);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function removeRequest(db, id, user) {
		if (hasPermission(user, 'userRequests', 'removeRequest')) {
			const result = await userInterface.remove(db, id);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function queryRequest(db, {queries, offset}, user) {
		const result = await userInterface.query(db, {queries, offset});
		if (hasPermission(user, 'userRequests', 'queryRequest')) {
			if (user.role === 'publisher-admin') {
				const queries = [{
					query: {publisher: user._id.toString()}
				}];
				const protectedProperties = {state: 0};
				const response = await userInterface.query(db, {queries, offset}, protectedProperties);
				return response;
			}

			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}
}

