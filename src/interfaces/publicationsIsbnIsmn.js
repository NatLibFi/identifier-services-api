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
	language
	publicationTime
	type
	publisher
	language
	authors{
		givenName
		familyName
		role
	}
	printDetails{
		manufacturer
	}
	lastUpdated{
		timestamp
		user
	}`;

	return {
		createISBN_ISMN,
		readISBN_ISMN,
		updateISBN_ISMN,
		removeISBN_ISMN,
		queryISBN_ISMN,
		createRequestISBN_ISMN,
		readRequestISBN_ISMN,
		updateRequestISBN_ISMN,
		removeRequestISBN_ISMN
	};

	async function createISBN_ISMN(db, data) {
		const query = `
			mutation($input:InputPublicationIsbnIsmn) {
				createPublicationIsbnIsmn(input:$input) {
					${queryReturn}
				}
			}
		`;
		const args = {input: data};
		const result = await graphql(schema, query, {createPublicationIsbnIsmn}, db, args);
		if (result.errors) {
			throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY);
		}

		return result;

		async function createPublicationIsbnIsmn({input}, db) {
			const newPublication = {
				...input,
				lastUpdated: {
					timestamp: `${date.toISOString()}`,
					user: 'user'
				}
			};
			const result = await db
				.collection('Publication_ISBN_ISMN')
				.insertOne(newPublication);
			return result.ops[0];
		}
	}

	async function readISBN_ISMN(db, id) {
		const query = `
				{
					publication_ISBN_ISMN(id: ${JSON.stringify(id)}) {
						${queryReturn}
					}
				}
			`;
		const result = await graphql(schema, query, {publication_ISBN_ISMN}, db);
		if (result.data.publication_ISBN_ISMN === null) {
			throw new ApiError(HttpStatus.NOT_FOUND);
		}

		return result;

		async function publication_ISBN_ISMN({id}, db) {
			const result = await db
				.collection('Publication_ISBN_ISMN')
				.findOne(objectId(id));
			return result;
		}
	}

	async function updateISBN_ISMN(db, id, data) {
		const query = `
				mutation($id: ID, $input:InputPublicationIsbnIsmn) {
					updatePublicationIsbnIsmn(id:$id, input:$input) {
						${queryReturn}
					}
				}
			`;
		const args = {id: id, input: data};
		const result = await graphql(schema, query, {updatePublicationIsbnIsmn}, db, args);
		if (result.errors) {
			throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY);
		}

		return result;

		async function updatePublicationIsbnIsmn({id, input}, db) {
			const updatePublication = {
				...input,
				lastUpdated: {
					timestamp: `${date.toISOString()}`,
					user: 'user'
				}
			};
			await db
				.collection('Publication_ISBN_ISMN')
				.findOneAndUpdate(
					{_id: objectId(id)},
					{$set: updatePublication},
					{upsert: true}
				);
			return db.collection('Publication_ISBN_ISMN').findOne(objectId(id));
		}
	}

	async function removeISBN_ISMN(db, id) {
		const query = `
				mutation{
					deletePublicationIsbnIsmn(id: ${JSON.stringify(id)}) {
						_id
					}
				}
			`;
		const result = graphql(schema, query, {deletePublicationIsbnIsmn}, db);
		if (result.errors) {
			throw new Error();
		}

		return result;

		async function deletePublicationIsbnIsmn({id}, db) {
			const deletedPublication = await db
				.collection('Publication_ISBN_ISMN')
				.findOneAndDelete({_id: objectId(id)});
			return deletedPublication.value;
		}
	}

	async function queryISBN_ISMN(db) {
		const query = `
				{
					Publications_ISBN_ISMN {
						${queryReturn}
					}
				}
			`;
		const result = await graphql(schema, query, {Publications_ISBN_ISMN}, db);
		if (result.errors) {
			throw new Error();
		}

		return result;

		async function Publications_ISBN_ISMN(root, db) {
			const result = await db
				.collection('Publication_ISBN_ISMN')
				.find()
				.toArray();
			return result;
		}
	}

	async function createRequestISBN_ISMN(db, data) {
		const query = `
				mutation($input: InputPublicationIsbnIsmnRequest) {
					createPublicationRequestIsbnIsmn(input:$input) {
						_id
					}
				}
			`;
		const args = {input: data};
		const result = await graphql(schema, query, {createPublicationRequestIsbnIsmn}, db, args);
		if (result.errors) {
			throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY);
		}

		return result;

		async function createPublicationRequestIsbnIsmn({input}, db) {
			const newPublicationRequest = {
				...input,
				lastUpdated: {
					timestamp: `${date.toISOString()}`,
					user: 'user'
				}
			};
			const result = await db
				.collection('PublicationRequest_ISBN_ISMN')
				.insertOne(newPublicationRequest);
			return result.ops[0];
		}
	}

	async function readRequestISBN_ISMN(db, id) {
		const query = `
				{
					publicationRequest_ISBN_ISMN(id: ${JSON.stringify(id)}) {
						${queryReturn}
					}
				}
			`;
		const result = await graphql(schema, query, {publicationRequest_ISBN_ISMN}, db);
		if (result.data.publicationRequest_ISBN_ISMN === null) {
			throw new ApiError(HttpStatus.NOT_FOUND);
		}

		return result;

		async function publicationRequest_ISBN_ISMN({id}, db) {
			const result = await db
				.collection('PublicationRequest_ISBN_ISMN')
				.findOne(objectId(id));
			return result;
		}
	}

	async function updateRequestISBN_ISMN(db, id, data) {
		const query = `
				mutation($id:ID, $input: InputPublicationIsbnIsmnRequest) {
					updatePublicationRequestIsbnIsmn(id:$id, input:$input) {
						_id
					}
				}
			`;
		const args = {id: id, input: data};
		const result = await graphql(schema, query, {updatePublicationRequestIsbnIsmn}, db, args);
		if (result.errors) {
			throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY);
		}

		return result;

		async function updatePublicationRequestIsbnIsmn({id, input}, db) {
			const updatePublicationRequest = {
				...input,
				lastUpdated: {
					timestamp: `${date.toString()}`,
					user: input.lastUpdated.user
				}
			};
			await db
				.collection('PublicationRequest_ISBN_ISMN')
				.findOneAndUpdate(
					{_id: objectId(id)},
					{$set: updatePublicationRequest},
					{upsert: true}
				);
			const result = await db.collection('PublicationRequest_ISBN_ISMN').findOne(objectId(id));
			return result;
		}
	}

	async function removeRequestISBN_ISMN(db, id) {
		const query = `
				mutation{
					deletePublicationRequestIsbnIsmn(id: ${JSON.stringify(id)}) {
						_id
					}
				}
			`;
		const result = await graphql(schema, query, {deletePublicationRequestIsbnIsmn}, db);
		if (result.errors) {
			throw new ApiError(HttpStatus.NOT_FOUND);
		}

		return result;

		async function deletePublicationRequestIsbnIsmn({id}, db) {
			const deletedPublicationRequest = await db
				.collection('PublicationRequest_ISBN_ISMN')
				.findOneAndDelete({_id: objectId(id)})
				.then(res => res.value);
			return deletedPublicationRequest;
		}
	}
}
