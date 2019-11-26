
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

import {filterResult, hasPermission, validateDoc} from './utils';
import interfaceFactory from './interfaceModules';

const publicationsRequestsIsbnIsmnInterface = interfaceFactory('PublicationRequest_ISBN_ISMN');

export default function () {
	return {
		createRequestIsbnIsmn,
		readRequestIsbnIsmn,
		updateRequestIsbnIsmn,
		removeRequestIsbnIsmn,
		queryRequestIsbnIsmn
	};

	async function createRequestIsbnIsmn(db, doc, user) {
		const newDoc = {...doc, state: 'new', backgroundProcessingState: 'pending', replyTo: user.emails[0].value};
		validateDoc(newDoc, 'PublicationIsbnIsmnRequestContent');
		if (hasPermission(user, 'publicationIsbnIsmnRequests', 'createRequestIsbnIsmn')) {
			const result = await publicationsRequestsIsbnIsmnInterface.create(db, newDoc, user);
			return result;
		}
	}

	async function readRequestIsbnIsmn(db, id, user) {
		let protectedProperties;
		const result = await publicationsRequestsIsbnIsmnInterface.read(db, id);
		if (hasPermission(user, 'publicationIsbnIsmnRequests', 'readRequestIsbnIsmn')) {
			if (user.role === 'publisher-admin' || user.role === 'publisher') {
				protectedProperties = {
					state: 0,
					publisher: 0,
					lastUpdated: 0
				};
				const res = await publicationsRequestsIsbnIsmnInterface.read(db, id, protectedProperties);
				return res;
			}

			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function updateRequestIsbnIsmn(db, id, doc, user) {
		let newDoc;
		newDoc = {...doc, backgroundProcessingState: doc.backgroundProcessingState ? doc.backgroundProcessingState : 'pending'};
		const readResult = await readRequestIsbnIsmn(db, id, user);
		if (hasPermission(user, 'publicationIsbnIsmnRequests', 'updateRequestIsbnIsmn')) {
			const result = await publicationsRequestsIsbnIsmnInterface.update(db, id, newDoc, user);
			return result;
		}

		if (user && readResult.publisher === user.id) {
			const result = await publicationsRequestsIsbnIsmnInterface.update(db, id, newDoc, user);
			return filterResult(result);
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function removeRequestIsbnIsmn(db, id, user) {
		if (hasPermission(user, 'publicationIsbnIsmnRequests', 'removeRequestIsbnIsmn')) {
			const result = await publicationsRequestsIsbnIsmnInterface.remove(db, id);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function queryRequestIsbnIsmn(db, {queries, offset}, user) {
		let protectedProperties;
		const result = await publicationsRequestsIsbnIsmnInterface.query(db, {queries, offset});
		if (hasPermission(user, 'publicationIsbnIsmnRequests', 'queryRequestIsbnIsmn')) {
			if (user.role === 'publisher-admin' || user.role === 'publisher') {
				protectedProperties = {
					state: 0,
					publisher: 0,
					lastUpdated: 0
				};
				const queries = [{
					query: {publisher: user.publisher}
				}];
				const response = await publicationsRequestsIsbnIsmnInterface.query(db, {queries, offset}, protectedProperties);
				return response;
			}

			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}
}
