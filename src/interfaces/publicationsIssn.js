/* eslint-disable camelcase */
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

import {graphql} from 'graphql';
import schema from '../graphql';
import HttpStatus from 'http-status';
import {ApiError} from '@natlibfi/identifier-services-commons';
const objectId = require('mongodb').ObjectId;
const date = new Date();

export default function () {
	const queryReturn = `
	_id
	title
	publisher
	year
	frequency
	language
	type
	language
	lastUpdated{
		timestamp
		user
	}`;

	return {
		createISSN,
		readISSN,
		updateISSN,
		removeISSN,
		queryISSN,
		createRequestISSN,
		readRequestISSN,
		updateRequestISSN,
		removeRequestISSN
	};

	async function createISSN(db, data) {
		const query = `
				mutation($input: InputPublicationIssn ) {
					createPublicationIssn(input: $input) {
						${queryReturn}
					}
				}
			`;
		const args = {input: data};
		const result = await graphql(schema, query, {createPublicationIssn}, db, args);
		if (result.errors) {
			throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY);
		}

		return result;

		async function createPublicationIssn({input}, db) {
			const newPublication = {
				...input,
				lastUpdated: {
					timestamp: `${date.toISOString()}`,
					user: 'user'
				}
			};
			const result = await db
				.collection('Publication_ISSN')
				.insertOne(newPublication);
			return result.ops[0];
		}
	}

	async function readISSN(db, id) {
		const query = `
				{
					publication_ISSN(id:${JSON.stringify(id)}) {
						${queryReturn}
					}
				}
			`;
		const result = await graphql(schema, query, {publication_ISSN}, db);
		if (result.data.publication_ISSN	 === null) {
			throw new ApiError(HttpStatus.NOT_FOUND);
		}

		return result;

		async function publication_ISSN({id}, db) {
			const result = await db
				.collection('Publication_ISSN')
				.findOne(objectId(id));
			return result;
		}
	}

	async function updateISSN(db, id, data) {
		const query = `
				mutation($id:ID, $input: InputPublicationIssn ) {
					updatePublicationIssn(id: $id, input: $input) {
						${queryReturn}
					}
				}
			`;
		const args = {id: id, input: data};
		const result = await graphql(schema, query, {updatePublicationIssn}, db, args);
		if (result.errors) {
			throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY);
		}

		return result;

		async function updatePublicationIssn({input, id}, db) {
			const updatePublication = {
				...input,
				lastUpdated: {
					timestamp: `${date.toISOString()}`,
					user: 'user'
				}
			};
			await db
				.collection('Publication_ISSN')
				.findOneAndUpdate(
					{_id: objectId(id)},
					{$set: updatePublication},
					{upsert: true}
				);
			return db
				.collection('Publication_ISSN')
				.findOne(objectId(id));
		}
	}

	async function removeISSN(db, id) {
		const query = `
			mutation{
				deletePublicationIssn(id: ${JSON.stringify(id)}) {
					_id
				}
			}
			`;
		const result = await graphql(schema, query, {deletePublicationIssn}, db);
		if (result.errors) {
			throw new ApiError(HttpStatus.NOT_FOUND);
		}

		return result;

		async function deletePublicationIssn({id}, db) {
			const deletedPublication = await db
				.collection('Publication_ISSN')
				.findOneAndDelete({_id: objectId(id)});
			return deletedPublication.value;
		}
	}

	async function queryISSN(db) {
		const query = `
				{
					Publications_ISSN {
						${queryReturn}
					}
				}
			`;
		const result = await graphql(schema, query, {Publications_ISSN}, db);
		if (result.errors) {
			throw new Error();
		}

		return result;

		async function Publications_ISSN(root, db) {
			const result = await db
				.collection('Publication_ISSN')
				.find()
				.toArray();
			return result;
		}
	}

	async function createRequestISSN(db, data) {
		const query = `
				mutation($input: InputPublicationRequestIssn) {
					createPublicationRequestIssn(input: $input) {
							${queryReturn}
						}
					}
			`;
		const args = {input: data};
		const result = await graphql(schema, query, {createPublicationRequestIssn}, db, args);
		if (result.errors) {
			throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY);
		}

		return result;

		async function createPublicationRequestIssn({input}, db) {
			const newPublicationRequest = {
				...input,
				lastUpdated: {
					timestamp: `${date.toISOString()}`,
					user: 'user'
				}
			};
			const result = await db
				.collection('PublicationRequest_ISSN')
				.insertOne(newPublicationRequest);
			return result.ops[0];
		}
	}

	async function updateRequestISSN(db, id, data) {
		const query = `
				mutation($id:ID, $input: InputPublicationRequestIssn) {
					updatePublicationRequestIssn(id: $id, input: $input) {
							${queryReturn}
						}
					}
			`;
		const args = {id: id, input: data};
		const result = await graphql(schema, query, {updatePublicationRequestIssn}, db, args);
		if (result.errors) {
			throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY);
		}

		return result;

		async function updatePublicationRequestIssn({id, input}, db) {
			const updatePublicationRequest = {
				...input,
				lastUpdated: {
					timestamp: `${date.toISOString()}`,
					user: 'user'
				}
			};
			await db
				.collection('PublicationRequest_ISSN')
				.findOneAndUpdate(
					{_id: objectId(id)},
					{$set: updatePublicationRequest},
					{upsert: true}
				);
			return db
				.collection('PublicationRequest_ISSN')
				.findOne(objectId(id));
		}
	}

	async function readRequestISSN(db, id) {
		const query = `
				{
					publicationRequest_ISSN(id:${JSON.stringify(id)}){
						${queryReturn} state
					}
				}
			`;
		const result = await graphql(schema, query, {publicationRequest_ISSN}, db);
		if (result.data.publicationRequest_ISSN	 === null) {
			throw new ApiError(HttpStatus.NOT_FOUND);
		}

		return result;

		async function publicationRequest_ISSN({id}, db) {
			const result = await db
				.collection('PublicationRequest_ISSN')
				.findOne(objectId(id));
			return result;
		}
	}

	async function removeRequestISSN(db, id) {
		const query = `
				mutation{
					deletePublicationRequestIssn(id:${JSON.stringify(id)}){
					_id
					}
				}
			`;
		const result = await graphql(schema, query, {deletePublicationRequestIssn}, db);
		if (result.errors) {
			throw new ApiError(HttpStatus.NOT_FOUND);
		}

		return result;

		async function deletePublicationRequestIssn({id}, db) {
			const deletedPublicationRequest = await db
				.collection('PublicationRequest_ISSN')
				.findOneAndDelete({_id: objectId(id)});
			return deletedPublicationRequest.value;
		}
	}
}
