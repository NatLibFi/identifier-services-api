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
import resolver from '../graphql/resolvers';

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
		try {
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
			const resolve = {createUser: resolver.createUser};
			const result = await graphql(schema, query, resolve, db, args);

			if (result.errors) {
				throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY);
			}

			return result;
		} catch (err) {
			throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY);
		}
	}

	async function read(db, id) {
		try {
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
			const resolve = {userMetadata: resolver.userMetadata};
			const result = await graphql(schema, query, resolve, db);
			if (result.data.userMetadata === null) {
				throw new ApiError(HttpStatus.NOT_FOUND);
			}

			return result;
		} catch (err) {
			throw new ApiError(HttpStatus.NOT_FOUND);
		}
	}

	async function update(db, id, data) {
		try {
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
			const resolve = {updateUser: resolver.updateUser};
			const result = await graphql(schema, query, resolve, db, args);

			if (result.errors) {
				throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY);
			}

			return result;
		} catch (err) {
			if (err.status === 422) {
				throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY);
			}

			throw new ApiError(HttpStatus.BAD_REQUEST);
		}
	}

	async function remove(db, id) {
		try {
			const query = `
			mutation {
				deleteUser(id: ${JSON.stringify(id)}) {
					_id
				}
			}
		`;
			const resolve = {deleteUser: resolver.deleteUser};
			const result = await graphql(schema, query, resolve, db);
			if (result.errors) {
				throw new Error();
			}

			return result;
		} catch (err) {
			throw new ApiError(HttpStatus.NOT_FOUND);
		}
	}

	async function changePwd(db) {
		return db;
	}

	async function query(db) {
		const resolve = {Users: resolver.Users};
		const result = await graphql(
			schema,
			'{Users{_id, preferences{defaultLanguage}, userId, lastUpdated{timestamp, user}}}',
			resolve,
			db,
		);
		return result;
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
		const resolve = {createRequest: resolver.createRequest};
		const result = await graphql(schema, query, resolve, db, args);
		return result;
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
		const resolve = {usersRequest: resolver.usersRequest};
		const result = await graphql(schema, query, resolve, db);
		return result;
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
		const resolve = {updateRequest: resolver.updateRequest};
		const result = await graphql(schema, query, resolve, db, args);
		return result;
	}

	async function removeRequest(db, id) {
		const query = `
			mutation {
				deleteRequest(id:${JSON.stringify(id)}) {
					_id
				}
			}
		`;

		const resolve = {deleteRequest: resolver.deleteRequest};
		const result = await graphql(schema, query, resolve, db);
		return result;
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

		const resolve = {UsersRequests: resolver.UsersRequests};

		return graphql(
			schema,
			query,
			resolve,
			db
		);
	}
}
