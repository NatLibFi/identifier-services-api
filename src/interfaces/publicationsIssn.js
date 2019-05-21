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
import HttpStatus from 'http-status';
import {ApiError} from '@natlibfi/identifier-services-commons';

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
		try {
			const query = `
				mutation($input: InputPublicationIssn ) {
					createPublicationIssn(input: $input) {
						${queryReturn}
					}
				}
			`;
			const args = {input: data};
			const resolve = {createPublicationIssn: resolvers.createPublicationIssn};
			const result = await graphql(schema, query, resolve, db, args);
			if (result.errors) {
				throw new Error();
			}

			return result;
		} catch (err) {
			throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY);
		}
	}

	async function readISSN(db, id) {
		try {
			const query = `
				{
					publication_ISSN(id:${JSON.stringify(id)}) {
						${queryReturn}
					}
				}
			`;
			const resolve = {publication_ISSN: resolvers.publication_ISSN};
			const result = await graphql(schema, query, resolve, db);
			if (result.data.publication_ISSN	 === null) {
				throw new Error();
			}

			return result;
		} catch (err) {
			throw new ApiError(HttpStatus.NOT_FOUND);
		}
	}

	async function updateISSN(db, id, data) {
		try {
			const query = `
				mutation($id:ID, $input: InputPublicationIssn ) {
					updatePublicationIssn(id: $id, input: $input) {
						${queryReturn}
					}
				}
			`;
			const args = {id: id, input: data};
			const resolve = {updatePublicationIssn: resolvers.updatePublicationIssn};
			const result = await graphql(schema, query, resolve, db, args);
			if (result.errors) {
				throw new Error();
			}

			return result;
		} catch (err) {
			throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY);
		}
	}

	async function removeISSN(db, id) {
		try {
			const query = `
			mutation{
				deletePublicationIssn(id: ${JSON.stringify(id)}) {
					_id
				}
			}
			`;
			const resolve = {deletePublicationIssn: resolvers.deletePublicationIssn};
			const result = await graphql(schema, query, resolve, db);
			if (result.errors) {
				throw new Error();
			}

			return result;
		} catch (err) {
			throw new ApiError(HttpStatus.NOT_FOUND);
		}
	}

	async function queryISSN(db) {
		try {
			const query = `
				{
					Publications_ISSN {
						${queryReturn}
					}
				}
			`;
			const resolve = {Publications_ISSN: resolvers.Publications_ISSN};
			const result = await graphql(schema, query, resolve, db);
			return result;
		} catch (err) {
			return err;
		}
	}

	async function createRequestISSN(db, data) {
		try {
			const query = `
				mutation($input: InputPublicationRequestIssn) {
					createPublicationRequestIssn(input: $input) {
							${queryReturn}
						}
					}
			`;
			const args = {input: data};
			const resolve = {createPublicationRequestIssn: resolvers.createPublicationRequestIssn};
			const result = await graphql(schema, query, resolve, db, args);
			if (result.errors) {
				throw new Error();
			}

			return result;
		} catch (err) {
			throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY);
		}
	}

	async function updateRequestISSN(db, id, data) {
		try {
			const query = `
				mutation($id:ID, $input: InputPublicationRequestIssn) {
					updatePublicationRequestIssn(id: $id, input: $input) {
							${queryReturn}
						}
					}
			`;
			const args = {id: id, input: data};
			const resolve = {updatePublicationRequestIssn: resolvers.updatePublicationRequestIssn};
			const result = await graphql(schema, query, resolve, db, args);
			if (result.errors) {
				throw new Error();
			}

			return result;
		} catch (err) {
			throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY);
		}
	}

	async function readRequestISSN(db, id) {
		try {
			const query = `
				{
					publicationRequest_ISSN(id:${JSON.stringify(id)}){
						${queryReturn} state
					}
				}
			`;
			const resolve = {publicationRequest_ISSN: resolvers.publicationRequest_ISSN};
			const result = await graphql(schema, query, resolve, db);
			if (result.data.publicationRequest_ISSN	 === null) {
				throw new Error();
			}

			return result;
		} catch (err) {
			throw new ApiError(HttpStatus.NOT_FOUND);
		}
	}

	async function removeRequestISSN(db, id) {
		try {
			const query = `
				mutation{
					deletePublicationRequestIssn(id:${JSON.stringify(id)}){
					_id
					}
				}
			`;
			const resolve = {deletePublicationRequestIssn: resolvers.deletePublicationRequestIssn};
			const result = await graphql(schema, query, resolve, db);
			if (result.errors) {
				throw new Error();
			}

			return result;
		} catch (err) {
			throw new ApiError(HttpStatus.NOT_FOUND);
		}
	}
}
