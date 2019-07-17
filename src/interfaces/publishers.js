/* eslint-disable no-shadow-restricted-names */
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

import {graphql} from 'graphql';
import HttpStatus from 'http-status';
import {ApiError} from '@natlibfi/identifier-services-commons';

import schema from '../graphql';
import {hasAdminPermission, hasSystemPermission} from './utils';

const objectId = require('mongodb').ObjectId;
const date = new Date();

export default function () {
	return {
		create,
		read,
		update,
		remove,
		query,
		createRequests,
		readRequest,
		removeRequest,
		updateRequest,
		queryRequests
	};

	async function query(db, data) {
		const query = `
			{
					SearchPublishers(first: ${2} after:"Y3Vyc29yOnYyOpHOBK0NoA=="){
						_id
						name
						language
						metadataDelivery
						primaryContact
						email
						phone
						website
						aliases
						notes
						activity {
							active
							yearInactivated
						}
						streetAddress {
							address
							city
							zip
						}
						lastUpdated {
							timestamp
							user
						}
					}
			}
		`;
		const SearchPublishers = async ({first, after}, db) => {
			const result = await db.collection('PublisherMetadata').find().toArray();
			if (after === null || after === undefined) {
				const index = result.map(m => m._id);
				return result.slice(0, first);
			}

			const index = result.map(m => m._id).indexOf(after) + 1;
			return result.slice(index, first + 1);
		};

		const result = await graphql(schema, query, {SearchPublishers}, db, {filter: data});
		return result;
	}

	async function read(db, id) {
		const query = `
		{
			Publisher{
				_id
				lastUpdated {
					timestamp
					user
				}
				notes
				name
				code
				language
				email
				phone
				website
				aliases
				postalAddress {
					address
					addressDetails
					city
					zip
					public
				}
				publicationDetails {
					frequency
				}
				classification
				organizationDetails {
					affiliateOf {
						address
						addressDetails
						city
						zip
						name
					}
					affiliates {
						address
						addressDetails
						city
						zip
						name
					}
					distributorOf {
						address
						addressDetails
						city
						zip
						name
					}
					distributor {
						address
						addressDetails
						city
						zip
						name
					}
				}
				metadataDelivery
				primaryContact
				activity {
					active
					yearInactivated
				}
				streetAddress {
					address
					city
					zip
				}
			}
		}
		`;
		const Publisher = async (undefined, ctx) => {
			const {id, db} = ctx;
			if (!objectId.isValid(id)) {
				throw new Error('Publisher doesnot exists');
			}

			const result = await db.collection('PublisherMetadata').findOne(objectId(id));
			return result;
		};

		const result = await graphql(schema, query, {Publisher}, {id, db});
		if (result.data.Publisher === null) {
			throw new ApiError(HttpStatus.NOT_FOUND);
		}

		return result;
	}

	async function create(db, data, user) {
		if (hasAdminPermission(user)) {
			const query = `
			mutation($input: PublisherInput){
				createPublisher(input: $input) {
					name
					language
				}
			}
		`;
			const createPublisher = async (args, db) => {
				const newPublisher = {
					...args.input,
					lastUpdated: {
						user: user.id,
						timestamp: date.toISOString()
					}
				};
				const result = await db.collection('PublisherMetadata').insertOne(newPublisher);
				return result.ops[0];
			};

			const result = await graphql(schema, query, {createPublisher}, db, {input: data});
			console.log('result', result)
			if (result.errors) {
				throw new ApiError(HttpStatus.BAD_REQUEST);
			}

			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function update(db, id, data, user) {
		const query = `
			mutation($input: PublisherInput){
				updatePublisher(input: $input) {
					name
					language
				}
			}
		`;
		const updatePublisher = async (args, cxt) => {
			const {db, id} = cxt;
			if (!objectId.isValid(id)) {
				throw new Error('Publisher doesnot exists');
			}

			const publisherUpdate = {
				...args.input,
				lastUpdated: {
					user: user.id,
					timestamp: new Date()
				}
			};
			await db.collection('PublisherMetadata').findOneAndUpdate({_id: objectId(id)}, {$set: publisherUpdate}, {upsert: true});
			const result = await db.collection('PublisherMetadata').findOne(objectId(id));
			return result;
		};

		const result = await graphql(schema, query, {updatePublisher}, {db, id}, {input: data});
		return result;
	}

	async function remove(db, id) {
		const query = `
			mutation($_id: ID){
				deletePublisher(_id: $_id) {
					name
					language
				}
			}
		`;
		const deletePublisher = async (undefined, ctx) => {
			const {id, db} = ctx;
			if (!objectId.isValid(id)) {
				throw new Error('Publisher doesnot exists');
			}

			const deletedPublisher = await db.collection('PublisherMetadata').findOneAndDelete({_id: objectId(id)});
			return deletedPublisher.value;
		};

		const result = await graphql(schema, query, {deletePublisher}, {db, id});
		return result;
	}

	async function createRequests(db, data, user) {
		if (hasSystemPermission(user)) {
			const query = `
				mutation($input: PublisherRequestInput){
					createPublisherRequests(input: $input) {
						name
						language
					}
				}
			`;
			const createPublisherRequests = async (args, db) => {
				const newPublisherRequests = {
					...args.input,
					lastUpdated: {
						user: user.id,
						timestamp: date.toDateString()
					}
				};
				const result = await db.collection('PublisherRequest').insertOne(newPublisherRequests);
				return result.ops[0];
			};

			const result = await graphql(schema, query, {createPublisherRequests}, db, {input: data});
			if (result.errors) {
				throw new ApiError(HttpStatus.BAD_REQUEST);
			}

			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function readRequest(db, id, user) {
		if (hasAdminPermission(user) || hasSystemPermission(user)) {
			const query = `
			{
				PublisherRequest{
					_id
					lastUpdated {
						timestamp
						user
					}
					notes
					backgroundProcessingState
					state
					rejectionReason
					createdResource
					name
					code
					language
					email
					phone
					website
					aliases
					postalAddress {
						address
						addressDetails
						city
						zip
						public
					}
					publicationDetails {
						frequency
					}
					classification
					organizationDetails {
						affiliateOf {
							address
							addressDetails
							city
							zip
							name
						}
						affiliates {
							address
							addressDetails
							city
							zip
							name
						}
						distributorOf {
							address
							addressDetails
							city
							zip
							name
						}
						distributor {
							address
							addressDetails
							city
							zip
							name
						}
					}
					primaryContact{
						givenName
						familyName
						email
					}
				}
			}
			`;
			const PublisherRequest = async (undefined, ctx) => {
				const {id, db} = ctx;
				if (!objectId.isValid(id)) {
					throw new Error('PublisherRequest doesnot exists');
				}

				const result = await db.collection('PublisherRequest').findOne(objectId(id));

				return result;
			};

			const result = await graphql(schema, query, {PublisherRequest}, {id, db});
			if (result.data.PublisherRequest === null) {
				throw new ApiError(HttpStatus.NOT_FOUND);
			}

			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function removeRequest(db, id, user) {
		if (hasSystemPermission(user)) {
			const query = `
				mutation($_id: ID){
					deletePublisherRequest(_id: $_id) {
						name
						language
					}
				}
			`;
			const deletePublisherRequest = async (undefined, ctx) => {
				const {id, db} = ctx;
				if (!objectId.isValid(id)) {
					throw new Error('PublisherRequest doesnot exists');
				}

				const deletePublisherRequest = await db.collection('PublisherRequest').findOneAndDelete({_id: objectId(id)});
				return deletePublisherRequest.value;
			};

			const result = await graphql(schema, query, {deletePublisherRequest}, {db, id});
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function updateRequest(db, id, data, user) {
		if (hasAdminPermission(user) || hasSystemPermission(user)) {
			const query = `
				mutation($input: PublisherRequestInput){
					updatePublisherRequest(input: $input) {
						name
						language
					}
				}
			`;
			const updatePublisherRequest = async (args, ctx) => {
				const {db, id} = ctx;
				if (!objectId.isValid(id)) {
					throw new Error('PublisherRequest doesnot exists');
				}

				const publisherRequestUpdate = {
					...args.input,
					lastUpdated: {
						...args.input.lastUpdated,
						timestamp: new Date()
					}
				};
				await db.collection('PublisherRequest').findOneAndUpdate({_id: objectId(id)}, {$set: publisherRequestUpdate}, {upsert: true});
				const result = await db.collection('PublisherRequest').findOne(objectId(id));
				return result;
			};

			const result = await graphql(schema, query, {updatePublisherRequest}, {db, id}, {input: data});
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function queryRequests(db, user) {
		if (hasAdminPermission(user) || hasSystemPermission(user)) {
			const query = `
			{
				PublisherRequests{
					_id
					lastUpdated {
						timestamp
						user
					}
					notes
					backgroundProcessingState
					state
					rejectionReason
					createdResource
					name
					code
					language
					email
					phone
					website
					aliases
					postalAddress {
						address
						addressDetails
						city
						zip
						public
					}
					publicationDetails {
						frequency
					}
					classification
					organizationDetails {
						affiliateOf {
							address
							addressDetails
							city
							zip
							name
						}
						affiliates {
							address
							addressDetails
							city
							zip
							name
						}
						distributorOf {
							address
							addressDetails
							city
							zip
							name
						}
						distributor {
							address
							addressDetails
							city
							zip
							name
						}
					}
					primaryContact{
						givenName
						familyName
						email
					}
				}
			}
			`;
			const PublisherRequests = async (undefined, db) => {
				const result = await db.collection('PublisherRequest').find().toArray();
				return result;
			};

			const result = await graphql(schema, query, {PublisherRequests}, db);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}
}
