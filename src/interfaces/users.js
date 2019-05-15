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
			const result = await graphql(
				schema,
				`
				mutation{
					createUser(
							userId:"${data.userId}", 
							preferences: {
								defaultLanguage: "${data.preferences.defaultLanguage}"
							}
					) {
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
			`,
				{db}
			);
			return result;
		} catch (err) {
			console.log(err);
		}
	}

	async function read(db, id) {
		const result = await graphql(
			schema,
			`
				{
					userMetadata {
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
			`,
			{db, id}
		);
		if (result.data.userMetadata === null) {
			throw new ApiError(HttpStatus.NOT_FOUND);
		}

		return result;
	}

	async function update(db, id, data) {
		const result = await graphql(
			schema,
			`
			mutation{
				updateUser(
						userId:"${data.userId}", 
						preferences: {
							defaultLanguage: "${data.preferences.defaultLanguage}"
						}
				) {
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
			`,
			{db, id}
		);
		return result;
	}

	async function remove(db, id) {
		const result = await graphql(
			schema,
			`
				mutation {
					deleteUser(_id: "${id}") {
						_id
					}
				}
			`,
			{db}
		);
		return result;
	}

	async function changePwd(db) {
		return db;
	}

	async function query(db) {
		return graphql(
			schema,
			'{Users{_id, preferences{defaultLanguage}, userId, lastUpdated{timestamp, user}}}',
			db
		);
	}

	// =====***************************** User Creation Request Starts From Here********************** ====

	async function createRequest(db, data) {
		return graphql(
			schema,
			`
				mutation{
					createRequest(
						userId: "${data.userId}",
						state: "${data.state}",
						publishers: ["${data.publishers ? data.publishers : null}"],
						givenName: "${data.givenName}",
						familyName: "${data.familyName}",
						email: "${data.email}",
						notes: ["${data.notes ? data.notes : null}"],
					) {
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
			`,
			{db}
		);
	}

	async function readRequest(db, id) {
		return graphql(
			schema,
			`
				{
					usersRequest{
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
			`,
			{db, id}
		);
	}

	async function updateRequest(db, id, data) {
		return graphql(
			schema,
			`
			mutation{
				updateRequest(
					userId: "${data.userId}",
					state: "${data.state}",
					publishers: ["${data.publishers ? data.publishers : null}"],
					givenName: "${data.givenName}",
					familyName: "${data.familyName}",
					email: "${data.email}",
					notes: ["${data.notes ? data.notes : null}"],
				) {
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
			`,
			{db, id}
		);
	}

	async function removeRequest(db, id) {
		return graphql(
			schema,
			`
				mutation {
					deleteRequest(_id:"${id}") {
						_id
					}
				}
			`,
			{db}
		);
	}

	async function queryRequest(db) {
		return graphql(
			schema,
			`
				{
					usersRequests {
						_id
						publishers
						givenName
						familyName
						email
						state
					}
				}
			`,
			db
		);
	}
}
