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
		const newDoc = {...doc, state: 'new', backgroundProcessingState: 'pending', creator: user.id};
		validateDoc(newDoc, 'PublisherRequestContent');
		if (hasPermission(user, 'publisherRequests', 'createRequest')) {
			const result = await publisherRequestsInterface.create(db, newDoc, user);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function readRequest(db, id, user) {
		if (hasPermission(user, 'publisherRequests', 'readRequest')) {
			const result = await publisherRequestsInterface.read(db, id);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function updateRequest(db, id, doc, user) {
		let newDoc;
		newDoc = {...doc, backgroundProcessingState: doc.backgroundProcessingState ? doc.backgroundProcessingState : 'pending'};

		if (hasPermission(user, 'publisherRequests', 'updateRequest')) {
			const result = await publisherRequestsInterface.update(db, id, newDoc, user);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function removeRequest(db, id, user) {
		if (hasPermission(user, 'publisherRequests', 'removeRequest')) {
			const result = await publisherRequestsInterface.remove(db, id, user);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function queryRequests(db, {queries, offset}, user) {
		if (hasPermission(user, 'publisherRequests', 'queryRequests')) {
			const result = await publisherRequestsInterface.query(db, {queries, offset});
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}
}
