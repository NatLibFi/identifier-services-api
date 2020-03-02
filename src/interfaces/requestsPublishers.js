/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file.
 *
 * API microservice of Melinda record batch import system
 *
 * Copyright (C) 2018-2019 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of melinda-record-import-api
 *
 * melinda-record-import-api program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * melinda-record-import-api is distributed in the hope that it will be useful,
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

import interfaceFactory from './interfaceModules';
import {hasPermission, validateDoc} from './utils';
import {ApiError} from '@natlibfi/identifier-services-commons';
import HttpStatus from 'http-status';

const publisherRequestsInterface = interfaceFactory('PublisherRequest');

export default function () {
	return {
		createRequest,
		readRequest,
		updateRequest,
		removeRequest,
		queryRequests
	};

	async function createRequest(db, doc, user) {
		try {
			const newDoc = {...doc, state: 'new', backgroundProcessingState: 'pending', creator: user.id};
			if (validateDoc(newDoc, 'PublisherRequestContent')) {
				if (hasPermission(user, 'publisherRequests', 'createRequest')) {
					return publisherRequestsInterface.create(db, newDoc, user);
				}

				throw new ApiError(HttpStatus.FORBIDDEN);
			} else {
				throw new ApiError(HttpStatus.BAD_REQUEST);
			}
		} catch (err) {
			if (err) {
				throw new ApiError(err.status ? err.status : HttpStatus.BAD_REQUEST);
			}
		}
	}

	async function readRequest(db, id, user) {
		try {
			if (hasPermission(user, 'publisherRequests', 'readRequest')) {
				return publisherRequestsInterface.read(db, id);
			}

			throw new ApiError(HttpStatus.FORBIDDEN);
		} catch (err) {
			if (err) {
				throw new ApiError(err.status ? err.status : HttpStatus.BAD_REQUEST);
			}
		}
	}

	async function updateRequest(db, id, doc, user) {
		try {
			let newDoc;
			newDoc = {...doc, backgroundProcessingState: doc.backgroundProcessingState ? doc.backgroundProcessingState : 'pending'};

			if (hasPermission(user, 'publisherRequests', 'updateRequest')) {
				return publisherRequestsInterface.update(db, id, newDoc, user);
			}

			throw new ApiError(HttpStatus.FORBIDDEN);
		} catch (err) {
			if (err) {
				throw new ApiError(err.status);
			}
		}
	}

	async function removeRequest(db, id, user) {
		if (hasPermission(user, 'publisherRequests', 'removeRequest')) {
			return publisherRequestsInterface.remove(db, id, user);
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function queryRequests(db, {queries, offset}, user) {
		try {
			if (hasPermission(user, 'publisherRequests', 'queryRequests')) {
				return publisherRequestsInterface.query(db, {queries, offset});
			}

			throw new ApiError(HttpStatus.FORBIDDEN);
		} catch (err) {
			if (err) {
				throw new ApiError(err.status);
			}
		}
	}
}
