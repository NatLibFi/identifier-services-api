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
import schema from '../graphql';
import HttpStatus from 'http-status';
import {ApiError} from '@natlibfi/identifier-services-commons';
import { hasAdminPermission } from './utils';
const objectId = require('mongodb').ObjectId;

export default function () {
	return {
		createIsbn,
		readIsbn,
		updateIsbn,
		queryIsbn,
		createIsmn,
		readIsmn,
		updateIsmn,
		queryIsmn,
		createIssn,
		readIssn,
		updateIssn,
		queryIssn
	};

	async function createIsbn(db, isbnData, user) {
		if (hasAdminPermission(user)) {
			const query = `
				mutation($input: RangeIsbnInput){
					createISBN(input: $input) {
						prefix
						language
						rangeStart
						rangeEnd
					}
				}
			`;
			const createISBN = async (args, db) => {
				const newISBN = {
					...args.input,
					lastUpdated: {
						...args.input.lastUpdated,
						timestamp: new Date()
					}
				};
				const result = await db.collection('IdentifierRangesISBN').insertOne(newISBN);
				return result.ops[0];
			};

			const result = await graphql(schema, query, {createISBN}, db, {input: isbnData});

			if (result.errors) {
				throw new ApiError(HttpStatus.BAD_REQUEST);
			}

			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function readIsbn(db, id, user) {
		if (hasAdminPermission(user)) {
			const query = `
				{
					ISBN{
						_id
						prefix
						language
						rangeStart
						rangeEnd
						active
						lastUpdated {
							timestamp
							user
						}
					}
				}
			`;
			const ISBN = async (undefined, ctx) => {
				const {id, db} = ctx;
				if (!objectId.isValid(id)) {
					throw new Error('ISBN doesnot exists');
				}

				const result = await db.collection('IdentifierRangesISBN').findOne(objectId(id));
				return result;
			};

			const result = await graphql(schema, query, {ISBN}, {id, db});
			if (result.data.ISBN === null) {
				throw new ApiError(HttpStatus.NOT_FOUND);
			}

			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function updateIsbn(db, id, data, user) {
		if (hasAdminPermission(user)) {
			const query = `
				mutation($input: RangeIsbnInput){
					updateISBN(input: $input) {
						prefix
						language
						rangeStart
						rangeEnd
					}
				}
			`;
			const updateISBN = async (args, cxt) => {
				const {db, id} = cxt;
				if (!objectId.isValid(id)) {
					throw new Error('ISBN doesnot exists');
				}

				const isbnUpdate = {
					...args.input,
					lastUpdated: {
						...args.input.lastUpdated,
						timestamp: new Date()
					}
				};
				await db
					.collection('IdentifierRangesISBN')
					.findOneAndUpdate({_id: objectId(id)}, {$set: isbnUpdate}, {upsert: true});
				const result = await db.collection('IdentifierRangesISBN').findOne(objectId(id));
				return result;
			};

			const result = await graphql(schema, query, {updateISBN}, {db, id}, {input: data});
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function queryIsbn(db, user) {
		if (hasAdminPermission(user)) {
			const query = `
				{
					ISBNs{
						_id
						prefix
						language
						rangeStart
						rangeEnd
						active
						lastUpdated {
							timestamp
							user
						}
					}
				}
			`;
			const ISBNs = async (undefined, db) => {
				const result = await db.collection('IdentifierRangesISBN').find().toArray();
				return result;
			};

			const result = await graphql(schema, query, {ISBNs}, db);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function createIsmn(db, data, user) {
		if (hasAdminPermission(user)) {
			const query = `
				mutation($input: RangeIsmnInput){
					createISMN(input: $input) {
						prefix
						rangeStart
						rangeEnd
					}
				}
			`;
			const createISMN = async (args, db) => {
				const newISMN = {
					...args.input,
					lastUpdated: {
						...args.input.lastUpdated,
						timestamp: new Date()
					}
				};
				const result = await db.collection('IdentifierRangesISMN').insertOne(newISMN);
				return result.ops[0];
			};

			const result = await graphql(schema, query, {createISMN}, db, {input: data});
			if (result.errors) {
				throw new ApiError(HttpStatus.BAD_REQUEST);
			}

			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function readIsmn(db, id, user) {
		if (hasAdminPermission(user)) {
			const query = `
				{
					ISMN{
						_id
						prefix
						rangeStart
						rangeEnd
						active
						notes
						lastUpdated {
							timestamp
							user
						}
					}
				}
			`;
			const ISMN = async (undefined, ctx) => {
				const {id, db} = ctx;
				if (!objectId.isValid(id)) {
					throw new Error('ISMN doesnot exists');
				}

				const result = await db.collection('IdentifierRangesISMN').findOne(objectId(id));
				return result;
			};

			const result = await graphql(schema, query, {ISMN}, {id, db});
			if (result.data.ISMN === null) {
				throw new ApiError(HttpStatus.NOT_FOUND);
			}

			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function updateIsmn(db, id, data, user) {
		if (hasAdminPermission(user)) {
			const query = `
				mutation($input: RangeIsmnInput){
					updateISMN(input: $input) {
						prefix
						rangeStart
						rangeEnd
					}
				}
			`;
			const updateISMN = async (args, cxt) => {
				const {db, id} = cxt;
				if (!objectId.isValid(id)) {
					throw new Error('ISMN doesnot exists');
				}

				const ismnUpdate = {
					...args.input,
					lastUpdated: {
						...args.input.lastUpdated,
						timestamp: new Date()
					}
				};
				await db.collection('IdentifierRangesISMN').findOneAndUpdate({_id: objectId(id)}, {$set: ismnUpdate}, {upsert: true});
				const result = await db.collection('IdentifierRangesISMN').findOne(objectId(id));
				return result;
			};

			const result = await graphql(schema, query, {updateISMN}, {db, id}, {input: data});
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function queryIsmn(db, user) {
		if (hasAdminPermission(user)) {
			const query = `
				{
					ISMNs{
						_id
						prefix
						rangeStart
						rangeEnd
						active
						notes
						lastUpdated {
							timestamp
							user
						}
					}
				}
			`;
			const ISMNs = async (undefined, db) => {
				const result = await db.collection('IdentifierRangesISMN').find().toArray();
				return result;
			};

			const result = await graphql(schema, query, {ISMNs}, db);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function createIssn(db, data, user) {
		if (hasAdminPermission(user)) {
			const query = `
				mutation($input: RangeIssnInput){
					createISSN(input: $input) {
						rangeStart
						rangeEnd
						active
					}
				}
			`;
			const createISSN = async (args, db) => {
				const newISSN = {
					...args.input,
					lastUpdated: {
						...args.input.lastUpdated,
						timestamp: new Date()
					}
				};
				const result = await db.collection('IdentifierRangesISSN').insertOne(newISSN);
				return result.ops[0];
			};

			const result = await graphql(schema, query, {createISSN}, db, {input: data});
			if (result.errors) {
				throw new ApiError(HttpStatus.BAD_REQUEST);
			}

			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function readIssn(db, id, user) {
		if (hasAdminPermission(user)) {
			const query = `
				{
					ISSN{
						_id
						rangeStart
						rangeEnd
						active
						lastUpdated {
							timestamp
							user
						}
					}
				}
			`;
			const ISSN = async (undefined, ctx) => {
				const {id, db} = ctx;
				if (!objectId.isValid(id)) {
					throw new Error('ISSN doesnot exists');
				}

				const result = await db.collection('IdentifierRangesISSN').findOne(objectId(id));
				return result;
			};

			const result = await graphql(schema, query, {ISSN}, {id, db});
			if (result.data.ISSN === null) {
				throw new ApiError(HttpStatus.NOT_FOUND);
			}

			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function updateIssn(db, id, data, user) {
		if (hasAdminPermission(user)) {
			const query = `
				mutation($input: RangeIssnInput){
					updateISSN(input: $input) {
						rangeStart
						rangeEnd
						active
					}
				}
			`;
			const updateISSN = async (args, cxt) => {
				const {db, id} = cxt;
				if (!objectId.isValid(id)) {
					throw new Error('ISSN doesnot exists');
				}

				const issnUpdate = {
					...args.input,
					lastUpdated: {
						...args.input.lastUpdated,
						timestamp: new Date()
					}
				};
				await db.collection('IdentifierRangesISSN').findOneAndUpdate({_id: objectId(id)}, {$set: issnUpdate}, {upsert: true});
				const result = await db.collection('IdentifierRangesISSN').findOne(objectId(id));
				return result;
			};

			const result = await graphql(schema, query, {updateISSN}, {db, id}, {input: data});
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function queryIssn(db, user) {
		if (hasAdminPermission(user)) {
			const query = `
				{
					ISSNs{
						_id
						prefix
						rangeStart
						rangeEnd
						active
						notes
						lastUpdated {
							timestamp
							user
						}
					}
				}
			`;
			const ISSNs = async (undefined, db) => {
				const result = await db
					.collection('IdentifierRangesISSN').find().toArray();
				return result;
			};

			const result = await graphql(schema, query, {ISSNs}, db);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}
}
