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

	async function create(db, data) {
		const query = `
							mutation($inputUser:InputUser){
								createUser(inputUser: $inputUser
								) {
									userId
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

		return result;

		async function createUser({inputUser}, db) {
			const newUser = {
				...inputUser,
				lastUpdated: {
					timestamp: `${date.toISOString()}`,
					user: 'data.lastUpdated.user'
				}
			};
			const createdResponse = await db
				.collection('userMetadata')
				.insertOne(newUser)
				.then(res => res.ops);
			return createdResponse[0];
		}
	}

	async function read(db, id) {
		const query = `
		{
				userMetadata(id: ${JSON.stringify(id)}) {
					_id
					userId
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

		return result;

		async function userMetadata({id}, db) {
			const result = await db
				.collection('userMetadata')
				.findOne(objectId(id));
			return result;
		}
	}

	async function update(db, id, data) {
		const query = `
							mutation($id:ID, $inputUser:InputUser){
								updateUser(id:$id, inputUser: $inputUser
								) {
									userId
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

		async function updateUser({inputUser, id}, db) {
			const updateUser = {
				...inputUser,
				lastUpdated: {
					timestamp: `${date.toISOString()}`,
					user: 'user'
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

	async function remove(db, id) {
		const query = `
			mutation {
				deleteUser(id: ${JSON.stringify(id)}) {
					_id
				}
			}
		`;
		const result = await graphql(schema, query, {deleteUser}, db);
		if (result.errors) {
			throw new ApiError(HttpStatus.NOT_FOUND);
		}

		return result;

		async function deleteUser({id}, db) {
			const deletedRequest = await db
				.collection('userMetadata')
				.findOneAndDelete({_id: objectId(id)})
				.then(res => res.value);
			return deletedRequest;
		}
	}

	async function changePwd(db) {
		return db;
	}

	async function query(db) {
		const result = await graphql(
			schema,
			'{Users{_id, preferences{defaultLanguage}, userId, lastUpdated{timestamp, user}}}',
			{Users},
			db,
		);

		if (result.errors) {
			throw new Error();
		}

		return result;

		async function Users(root, db) {
			const result = await db
				.collection('userMetadata')
				.find()
				.toArray();
			return result;
		}
	}

	// =====***************************** User Creation Request Starts From Here********************** ====

	async function createRequest(db, data) {
		const query = `
			mutation($inputUserRequest: InputUserRequest){
				createRequest(inputUserRequest: $inputUserRequest) {
					_id
					userId
					state
					publishers
					givenName
					familyName
					email
					notes
					lastUpdated {
						timestamp
						user
					}
				}
			}
		`;
		const args = {inputUserRequest: data};
		const result = await graphql(schema, query, {createRequest}, db, args);

		if (result.errors) {
			throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY);
		}

		return result;

		async function createRequest({inputUserRequest}, db) {
			const newUserRequest = {
				...inputUserRequest,
				lastUpdated: {
					timestamp: `${date.toISOString()}`,
					user: 'data.lastUpdated.user'
				}
			};
			const createdResponse = await db
				.collection('usersRequest')
				.insertOne(newUserRequest)
				.then(res => res.ops);
			return createdResponse[0];
		}
	}

	async function readRequest(db, id) {
		const query = `
			{
				usersRequest(id:${JSON.stringify(id)}){
					userId
					state
					publishers
					givenName
					familyName
					email
					notes
					lastUpdated {
						timestamp
						user
					}
				}
			}
		`;
		const result = await graphql(schema, query, {usersRequest}, db);
		if (result.data.usersRequest === null) {
			throw new ApiError(HttpStatus.NOT_FOUND);
		}

		return result;

		async function usersRequest({id}, db) {
			const result = await db
				.collection('usersRequest')
				.findOne(objectId(id));
			return result;
		}
	}

	async function updateRequest(db, id, data) {
		const query = `
			mutation($id:ID, $inputUserRequest: InputUserRequest){
				updateRequest(id:$id, inputUserRequest: $inputUserRequest) {
					_id
					state
					publishers
					givenName
					familyName
					email
					notes
					lastUpdated {
						timestamp
						user
					}
				}
			}
			`;

		const args = {id: id, inputUserRequest: data};
		const result = await graphql(schema, query, {updateRequest}, db, args);

		if (result.errors) {
			throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY);
		}

		return result;

		async function updateRequest({inputUserRequest, id}, db) {
			const updateRequest = {
				...inputUserRequest,
				lastUpdated: {
					timestamp: `${date.toISOString()}`,
					user: 'data.lastUpdated.user'
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

	async function removeRequest(db, id) {
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

		async function deleteRequest({id}, db) {
			const deletedRequest = await db
				.collection('usersRequest')
				.findOneAndDelete({_id: objectId(id)})
				.then(res => res.value);
			return deletedRequest;
		}
	}

	async function queryRequest(db) {
		const query = `
			{
				UsersRequests {
					_id
					publishers
					givenName
					familyName
					email
					state
				}
			}
		`;
		const result = await graphql(
			schema,
			query,
			{UsersRequests},
			db
		);
		if (result.errors) {
			throw new ApiError(HttpStatus.NOT_FOUND);
		}

		return result;

		async function UsersRequests(root, db) {
			const result = await db
				.collection('usersRequest')
				.find()
				.toArray();
			return result;
		}
	}
}

