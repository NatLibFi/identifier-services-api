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
import resolvers from '../graphql/resolvers';

export default function () {
	const queryReturn = `
	_id
	title
	language
	publicationTime
	type
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
		try {
			const query = `
			mutation($input:InputPublicationIsbnIsmn) {
				createPublicationIsbnIsmn(input:$input) {
					${queryReturn}
				}
			}
		`;
			const args = {input: data};
			const resolve = {createPublicationIsbnIsmn: resolvers.createPublicationIsbnIsmn};
			const result = await graphql(schema, query, resolve, db, args);
			return result;
		} catch (err) {
			return err;
		}
	}

	async function readISBN_ISMN(db, id) {
		try {
			const query = `
				{
					publication_ISBN_ISMN(id: ${JSON.stringify(id)}) {
						${queryReturn}
					}
				}
			`;
			const resolve = {publication_ISBN_ISMN: resolvers.publication_ISBN_ISMN};
			const result = await graphql(schema, query, resolve, db);
			return result;
		} catch (err) {
			return err;
		}
	}

	async function updateISBN_ISMN(db, id, data) {
		try {
			const query = `
				mutation($id: ID, $input:InputPublicationIsbnIsmn) {
					updatePublicationIsbnIsmn(id:$id, input:$input) {
						${queryReturn}
					}
				}
			`;
			const args = {id: id, input: data};
			const resolve = {updatePublicationIsbnIsmn: resolvers.updatePublicationIsbnIsmn};
			const result = await graphql(schema, query, resolve, db, args);
			return result;
		} catch (err) {
			return err;
		}
	}

	async function removeISBN_ISMN(db, id) {
		try {
			const query = `
				mutation{
					deletePublicationIsbnIsmn(id: ${JSON.stringify(id)}) {
						_id
					}
				}
			`;
			const resolve = {deletePublicationIsbnIsmn: resolvers.deletePublicationIsbnIsmn};
			const result = graphql(schema, query, resolve, db);
			return result;
		} catch (err) {
			return err;
		}
	}

	async function queryISBN_ISMN(db) {
		try {
			const query = `
				{
					Publications_ISBN_ISMN {
						${queryReturn}
					}
				}
			`;
			const resolve = {Publications_ISBN_ISMN: resolvers.Publications_ISBN_ISMN};
			const result = await graphql(schema, query, resolve, db);
			return result;
		} catch (err) {
			return err;
		}
	}

	async function createRequestISBN_ISMN(db, data) {
		try {
			const query = `
				mutation($input: InputPublicationIsbnIsmnRequest) {
					createPublicationRequestIsbnIsmn(input:$input) {
						_id
					}
				}
			`;
			const args = {input: data};
			const resolve = {createPublicationRequestIsbnIsmn: resolvers.createPublicationRequestIsbnIsmn};
			const result = await graphql(schema, query, resolve, db, args);
			return result;
		} catch (err) {
			return err;
		}
	}

	async function readRequestISBN_ISMN(db, id) {
		try {
			const query = `
				{
					publicationRequest_ISBN_ISMN(id: ${JSON.stringify(id)}) {
						${queryReturn}
					}
				}
			`;
			const resolve = {publicationRequest_ISBN_ISMN: resolvers.publicationRequest_ISBN_ISMN};
			const result = await graphql(schema, query, resolve, db);
			return result;
		} catch (err) {
			return err;
		}
	}

	async function updateRequestISBN_ISMN(db, id, data) {
		try {
			const query = `
				mutation($id:ID, $input: InputPublicationIsbnIsmnRequest) {
					updatePublicationRequestIsbnIsmn(id:$id, input:$input) {
						_id
					}
				}
			`;
			const args = {id: id, input: data};
			const resolve = {updatePublicationRequestIsbnIsmn: resolvers.updatePublicationRequestIsbnIsmn};
			const result = await graphql(schema, query, resolve, db, args);
			return result;
		} catch (err) {
			return err;
		}
	}

	async function removeRequestISBN_ISMN(db, id) {
		try {
			const query = `
				mutation{
					deletePublicationRequestIsbnIsmn(id: ${JSON.stringify(id)}) {
						_id
					}
				}
			`;
			const resolve = {deletePublicationRequestIsbnIsmn: resolvers.deletePublicationRequestIsbnIsmn};
			const result = await graphql(schema, query, resolve, db);
			return result;
		} catch (err) {
			return err;
		}
	}
}
