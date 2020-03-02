
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
		try {
			if (Object.keys(doc).length === 0) {
				throw new ApiError(HttpStatus.BAD_REQUEST);
			}

			const newDoc = {...doc, state: 'new', backgroundProcessingState: 'pending', creator: user.id};
			if (validateDoc(newDoc, 'PublicationIsbnIsmnRequestContent')) {
				if (hasPermission(user, 'publicationIsbnIsmnRequests', 'createRequestIsbnIsmn')) {
					return publicationsRequestsIsbnIsmnInterface.create(db, newDoc, user);
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

	async function readRequestIsbnIsmn(db, id, user) {
		try {
			let protectedProperties;
			const result = await publicationsRequestsIsbnIsmnInterface.read(db, id);
			if (hasPermission(user, 'publicationIsbnIsmnRequests', 'readRequestIsbnIsmn')) {
				if (result === null) {
					throw new ApiError(HttpStatus.NOT_FOUND);
				}

				if (user.role === 'publisher-admin' || user.role === 'publisher') {
					if (user.publisher === result.publisher) {
						protectedProperties = {
							state: 0,
							publisher: 0,
							lastUpdated: 0
						};
						const res = await publicationsRequestsIsbnIsmnInterface.read(db, id, protectedProperties);
						/* eslint max-depth: ["error", 5] */
						/* eslint-env es6 */
						if (res === null) {
							throw new ApiError(HttpStatus.NOT_FOUND);
						}

						return res;
					}

					throw new ApiError(HttpStatus.FORBIDDEN);
				}

				return result;
			}

			throw new ApiError(HttpStatus.FORBIDDEN);
		} catch (err) {
			throw new ApiError(err.status);
		}
	}

	async function updateRequestIsbnIsmn(db, id, doc, user) {
		try {
			if (Object.keys(doc).length === 0) {
				throw new ApiError(HttpStatus.BAD_REQUEST);
			}

			let newDoc;
			newDoc = {...doc, backgroundProcessingState: doc.backgroundProcessingState ? doc.backgroundProcessingState : 'pending'};
			if (validateDoc(newDoc, 'PublicationIsbnIsmnRequestContent')) {
				const readResult = await readRequestIsbnIsmn(db, id, user);
				if (hasPermission(user, 'publicationIsbnIsmnRequests', 'updateRequestIsbnIsmn')) {
					return publicationsRequestsIsbnIsmnInterface.update(db, id, newDoc, user);
				}

				if (user && readResult.publisher === user.id) {
					const result = await publicationsRequestsIsbnIsmnInterface.update(db, id, newDoc, user);
					return filterResult(result);
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

	async function removeRequestIsbnIsmn(db, id, user) {
		try {
			if (hasPermission(user, 'publicationIsbnIsmnRequests', 'removeRequestIsbnIsmn')) {
				return publicationsRequestsIsbnIsmnInterface.remove(db, id);
			}

			throw new ApiError(HttpStatus.FORBIDDEN);
		} catch (err) {
			if (err) {
				throw new ApiError(err.status);
			}
		}
	}

	async function queryRequestIsbnIsmn(db, {queries, offset}, user) {
		try {
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
					return publicationsRequestsIsbnIsmnInterface.query(db, {queries, offset}, protectedProperties);
				}

				if (result.results.length === 0) {
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
}
