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

const publicationsIsbnIsmnInterface = interfaceFactory('Publication_ISBN_ISMN', 'PublicationIsbnIsmnContent');

export default function () {
	return {
		createIsbnIsmn,
		readIsbnIsmn,
		updateIsbnIsmn,
		queryIsbnIsmn
	};

	async function createIsbnIsmn(db, doc, user) {
		try {
			if (Object.keys(doc).length === 0) {
				throw new ApiError(HttpStatus.BAD_REQUEST);
			}

			if (validateDoc(doc, 'PublicationIsbnIsmnContent')) {
				if (hasPermission(user, 'publicationIsbnIsmn', 'createIsbnIsmn')) {
					doc.publisher = user.id;
					doc.metadataReference =	{state: 'pending'};
					return publicationsIsbnIsmnInterface.create(db, doc, user);
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

	async function readIsbnIsmn(db, id, user) {
		try {
			const result = await publicationsIsbnIsmnInterface.read(db, id);
			if (hasPermission(user, 'publicationIsbnIsmn', 'readIsbnIsmn')) {
				if (result === null) {
					throw new ApiError(HttpStatus.NOT_FOUND);
				}

				if (user.role === 'publisher-admin') {
					if (user.publisher === result.publisher) {
						return result;
					}

					throw new ApiError(HttpStatus.FORBIDDEN);
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

	async function updateIsbnIsmn(db, id, doc, user) {
		try {
			if (Object.keys(doc).length === 0) {
				throw new ApiError(HttpStatus.BAD_REQUEST);
			}

			if (validateDoc(doc, 'PublicationIsbnIsmnContent')) {
				if (hasPermission(user, 'publicationIsbnIsmn', 'updateIsbnIsmn')) {
					return publicationsIsbnIsmnInterface.update(db, id, doc, user);
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

	// Async function removeIsbnIsmn(db, id) {
	// 	if (hasAdminPermission(user) || hasSystemPermission(user)) {
	// 		const result = await publicationsIsbnIsmnInterface.remove(db, id);
	// 		return result;
	// 	}

	// 	throw new ApiError(HttpStatus.FORBIDDEN);
	// }

	async function queryIsbnIsmn(db, {queries, offset}, user) {
		const result = await publicationsIsbnIsmnInterface.query(db, {queries, offset});
		if (hasPermission(user, 'publicationIsbnIsmn', 'queryIsbnIsmn')) {
			if (user.role === 'publisher-admin' || user.role === 'publisher') {
				const queries = [{
					query: {publisher: user.publisher}
				}];
				return publicationsIsbnIsmnInterface.query(db, {queries, offset});
			}

			return result;
		}

		if (user) {
			return result.results.filter(item => item.publisher === user.id);
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}
}
