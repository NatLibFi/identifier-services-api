/* eslint-disable no-else-return */
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
import HttpStatus from 'http-status';
import {ApiError} from '@natlibfi/identifier-services-commons';
import schema from '../graphql';
import {hasAdminPermission, hasSystemPermission, hasPublisherAdminPermission, countFn, pagination} from './utils';

const objectId = require('mongodb').ObjectId;
const date = new Date();

const queryReturn = `
	_id
	givenName
	familyName
	publisher
	emails{
		value
		type
	}
	`;

export default function () {
	return {
		create,
		read,
		update,
		remove,
		changePwd,
		query,
		createRequest,
		readRequest,
		updateRequest,
		removeRequest,
		queryRequest
	};

	async function create(db, data, user) {
		const requestId = data._id;
		delete data._id;
		if (hasAdminPermission(user)) {
			const query = `
				mutation($inputUser:UserInput){
					createUser(inputUser: $inputUser
					) {
						preferences {
							defaultLanguage
						}
						lastUpdated {
							timestamp
							user
						}
					}
				}
			`;
			const args = {inputUser: data};
			const result = await graphql(schema, query, {createUser}, db, args);
			if (result.errors) {
				throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY);
			}

			await db
				.collection('usersRequest')
				.findOneAndDelete({_id: objectId(requestId)})
				.then(res => res.value);

			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);

		async function createUser({inputUser}, db) {
			const newUser = {
				...inputUser,
				publisher: hasPublisherAdminPermission(user) ? user.id : 'admin',
				lastUpdated: {
					timestamp: `${date.toISOString()}`,
					user: user.id
				}
			};
			const createdResponse = await db
				.collection('userMetadata')
				.insertOne(newUser)
				.then(res => res.ops);
			return createdResponse[0];
		}
	}

	async function read(db, id, user) {
		async function query() {
			const query = `
				{
						userMetadata(id: ${JSON.stringify(id)}) {
							_id
							givenName
							publisher
							preferences {
								defaultLanguage
							}
							lastUpdated {
								timestamp
								user
							}
						}
				}
			`;
			const result = await graphql(schema, query, {userMetadata}, db);
			if (result.data.userMetadata === null) {
				throw new ApiError(HttpStatus.NOT_FOUND);
			}

			return {...user, userInfo: result.data};
		}

		const response = await query();

		if (id === response.userInfo.userMetadata._id || hasAdminPermission(user) || user.id === response.userInfo.userMetadata.publisher) {
			return response;
		} else {
			throw new ApiError(HttpStatus.FORBIDDEN);
		}

		async function userMetadata({id}, db) {
			const result = await db
				.collection('userMetadata')
				.findOne(objectId(id));
			return result;
		}
	}

	async function update(db, id, data, user) {
		async function query() {
			const query = `
							mutation($id:ID, $inputUser: UserInput){
								updateUser(id:$id, inputUser: $inputUser
								) {
									preferences {
										defaultLanguage
									}
									lastUpdated {
										timestamp
										user
									}
								}
							}
						`;
			const args = {id: id, inputUser: data};
			const result = await graphql(schema, query, {updateUser}, db, args);

			if (result.errors) {
				throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY);
			}

			return result;
		}

		const response = query();
		if (id === user.id || hasAdminPermission(user)) {
			return response;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);

		async function updateUser({inputUser, id}, db) {
			const updateUser = {
				...inputUser,
				lastUpdated: {
					timestamp: `${date.toISOString()}`,
					user: user.id
				}
			};
			await db
				.collection('userMetadata')
				.findOneAndUpdate(
					{_id: objectId(id)},
					{$set: updateUser},
					{upsert: true}
				);
			return db.collection('userMetadata').findOne(objectId(id));
		}
	}

	async function remove(db, id, user) {
		if (hasAdminPermission(user)) {
			const query = `
				mutation {
					deleteUser(id: ${JSON.stringify(id)}) {
						givenName
					}
				}
			`;
			const result = await graphql(schema, query, {deleteUser}, db);
			if (result.errors) {
				throw new ApiError(HttpStatus.NOT_FOUND);
			}

			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);

		async function deleteUser({id}, db) {
			const deletedRequest = await db
				.collection('userMetadata')
				.findOneAndDelete({givenName: id})
				.then(res => res.value);
			return deletedRequest;
		}
	}

	async function changePwd(db, id, user) {
		if (id === user.id || hasAdminPermission(user) || hasSystemPermission(user)) {
			return db;
		}
	}

	async function query(db, body, user, queryData) {
		const input = JSON.stringify(user.id);
		const collectionName = 'userMetadata';
		const query = `
			{
				Users(input: ${input}){
					_id
					givenName
					publisher
					preferences {
						defaultLanguage
					}
					lastUpdated {
						timestamp
						user
					}
				}
			}
		`;

		const result = await graphql(schema, query, {Users}, db);
		if (result.errors) {
			throw new Error();
		}

		const count = (hasAdminPermission(user) || hasSystemPermission(user)) ? await countFn(db, collectionName, queryData) : await countFn(db, collectionName, queryData, {publisher: user.id});
		const newResult = {...result, total: count.length};
		return newResult;

		async function Users({input}, db) {
			if (hasAdminPermission(user) || hasSystemPermission(user)) {
				return pagination(db, collectionName, queryData);
			} else if (hasPublisherAdminPermission(user)) {
				return pagination(db, collectionName, queryData, {publisher: input});
			} else {
				return [];
			}
		}
	}

	// =====***************************** User Creation Request Starts From Here********************** ====

	async function createRequest(db, data, user) {
		const query = `
			mutation($usersRequestInput: UsersRequestInput){
				createUsersRequest(usersRequestInput: $usersRequestInput) {
					givenName
					familyName
					emails{
						value
						type
					}
				}
			}
		`;
		const args = {usersRequestInput: data};
		const result = await graphql(schema, query, {createUsersRequest}, db, args);
		if (result.errors) {
			throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY);
		}

		return result;

		async function createUsersRequest({usersRequestInput}, db) {
			const newUserRequest = {
				...usersRequestInput,
				lastUpdated: {
					timestamp: `${date.toISOString()}`,
					user: user.id
				}
			};
			const createdResponse = await db
				.collection('usersRequest')
				.insertOne(newUserRequest)
				.then(res => res.ops);
			return createdResponse[0];
		}
	}

	async function readRequest(db, id, user) {
		async function query() {
			const query = `
				{
					usersRequestContent(id:${JSON.stringify(id)}){
						${queryReturn}
					}
				}
			`;
			const result = await graphql(schema, query, {usersRequestContent}, db);
			if (result.data.usersRequestContent === null) {
				throw new ApiError(HttpStatus.NOT_FOUND);
			}

			return result;
		}

		const response = await query();
		if (hasAdminPermission(user) || hasSystemPermission(user) || user.id === response.data.usersRequestContent.publisher) {
			return response;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);

		async function usersRequestContent({id}, db) {
			const result = await db
				.collection('usersRequest')
				.findOne(objectId(id));
			return result;
		}
	}

	async function updateRequest(db, id, values) {
		const {data, user} = values;
		async function query() {
			const query = `
			mutation($id:ID, $inputUserRequest: InputUserRequest){
				updateRequest(id:$id, inputUserRequest: $inputUserRequest) {
					${queryReturn}
				}
			}
			`;

			const args = {id: id, inputUserRequest: data};
			const result = await graphql(schema, query, {updateRequest}, db, args);

			if (result.errors) {
				throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY);
			}

			return result;
		}

		const response = query();

		if (hasAdminPermission(user) || hasSystemPermission(user) || user.id === response.userInfo.userMetadata.publisher) {
			return response;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);

		async function updateRequest({inputUserRequest, id}, db) {
			const updateRequest = {
				...inputUserRequest,
				lastUpdated: {
					timestamp: `${date.toISOString()}`,
					user: user.id
				}
			};
			await db
				.collection('usersRequest')
				.findOneAndUpdate(
					{_id: objectId(id)},
					{$set: updateRequest},
					{upsert: true}
				);
			return db
				.collection('usersRequest')
				.findOne(objectId(id));
		}
	}

	async function removeRequest(db, id, user) {
		async function query() {
			const query = `
				mutation {
					deleteRequest(id:${JSON.stringify(id)}) {
						_id
					}
				}
			`;

			const result = await graphql(schema, query, {deleteRequest}, db);
			if (result.errors) {
				throw new ApiError(HttpStatus.NOT_FOUND);
			}

			return result;
		}

		const response = query();

		if (hasSystemPermission(user)) {
			return response;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);

		async function deleteRequest({id}, db) {
			const deletedRequest = await db
				.collection('usersRequest')
				.findOneAndDelete({_id: objectId(id)})
				.then(res => res.value);
			return deletedRequest;
		}
	}

	async function queryRequest(db, body, user) {
		const input = JSON.stringify(user.id);
		const query = `
			{
				UsersRequestContents(input: ${input}) {
					${queryReturn}
				}
			}
		`;
		const result = await graphql(
			schema,
			query,
			{UsersRequestContents},
			db
		);
		if (result.errors) {
			throw new ApiError(HttpStatus.NOT_FOUND);
		}

		const newResult = {result: result.data.UsersRequestContents.slice(body.first, (body.offset + body.first)), total: result.data.UsersRequestContents.length};
		return newResult;

		async function UsersRequestContents({input}, db) {
			if (hasAdminPermission(user) || hasSystemPermission(user)) {
				const result = await db
					.collection('usersRequest')
					.find()
					.toArray();
				return result;
			} else if (hasPublisherAdminPermission(user)) {
				const result = await db
					.collection('usersRequest')
					.find({publisher: input})
					.toArray();
				return result;
			} else {
				return [];
			}
		}
	}
}

