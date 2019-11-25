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

import {filterResult, hasPermission} from './utils';
import interfaceFactory from './interfaceModules';

const publicationsRequestsIssnInterface = interfaceFactory('PublicationRequest_ISSN', 'PublicationIssnRequestContent');
const userInterface = interfaceFactory('userMetadata', 'UserContent');

export default function () {
	return {
		createRequestISSN,
		readRequestISSN,
		updateRequestISSN,
		removeRequestISSN,
		queryRequestISSN
	};

	async function createRequestISSN(db, doc, user) {
		const newDoc = {...doc, state: 'new', backgroundProcessingState: 'pending', replyTo: user.email[0].value};
		if (hasPermission(user, 'publicationIssnRequests', 'createRequestISSN')) {
			const result = await publicationsRequestsIssnInterface.create(db, newDoc, user);
			return result;
		}
	}

	async function readRequestISSN(db, id, user) {
		const result = await publicationsRequestsIssnInterface.read(db, id);
		if (hasPermission(user, 'publicationIssnRequests', 'readRequestISSN')) {
			return result;
		}

		if (user && result.publisher === user.id) {
			return filterResult(result);
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function updateRequestISSN(db, id, doc, user) {
		const readResult = await readRequestISSN(db, id, user);
		if (hasPermission(user, 'publicationIssnRequests', 'updateRequestISSN')) {
			const result = await publicationsRequestsIssnInterface.update(db, id, doc, user);
			return result;
		}

		if (user && readResult.publisher === user.id) {
			const result = await publicationsRequestsIssnInterface.update(db, id, doc, user);
			return filterResult(result);
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function removeRequestISSN(db, id, user) {
		if (hasPermission(user, 'publicationIssnRequests', 'readRequestISSN')) {
			const result = await publicationsRequestsIssnInterface.remove(db, id);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function queryRequestISSN(db, {queries, offset}, user) {
		let protectedProperties;
		const result = await publicationsRequestsIssnInterface.query(db, {queries, offset}, protectedProperties);
		if (hasPermission(user, 'publicationIssnRequests', 'queryRequestISSN')) {
			if (user.role === 'publisher-admin') {
				protectedProperties = {
					state: 0,
					publisher: 0,
					lastUpdated: 0
				};
				const queries = [{
					query: {publisher: user.id}
				}];
				const response = await userInterface.query(db, {queries, offset});

				return response.results.reduce((acc, i) => {
					result.results.map(k =>
						k.publisher === i.email && acc.push(k)
					);
					return {results: acc.map(item => filterResult(item))};
				}, []);
			}

			if (user.role === 'publisher') {
				const userQueries = [{
					query: {id: user.id}
				}];
				const issnQueries = [{
					query: {publisher: 'co_incidence9999@yahoo.com'} // Need to discuss
				}];
				await userInterface.query(db, {queries: userQueries, offset});
				const result = await publicationsRequestsIssnInterface.query(db, {queries: issnQueries, offset});
				return result;
			}

			return result;
		}

		// If (user) {
		// 	const response = await db.collection('userMetadata').findOne({id: user.id});
		// 	return {results: result.results.filter(item => item.publisher === response.id && filterResult(item))};
		// }

		throw new ApiError(HttpStatus.FORBIDDEN);
	}
}
