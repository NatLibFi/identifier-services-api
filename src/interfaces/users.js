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
		return graphql(
			schema,
			`
				mutation(
					$userId: String
					$preferences: PreferencesInput
					$lastUpdated: LastUpdatedInput
				) {
					createUser(
						userId: $userId
						preferences: $preferences
						lastUpdated: $lastUpdated
						
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
			{db, data}
		);
	}

	async function read(db, id) {
		return graphql(
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
	}

	async function update(db, id, data) {
		return graphql(
			schema,
			`
				mutation(
					$userId: String
					$preferences: PreferencesInput
					$lastUpdated: LastUpdatedInput
				) {
					updateUser(
						userId: $userId
						preferences: $preferences
						lastUpdated: $lastUpdated
						
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
			{db, id, data}
		);
	}

	async function remove(db, id) {
		return graphql(
			schema,
			`
				mutation($id: ID) {
					deleteUser(_id: $id) {
						_id
					}
				}
			`,
			{db, id}
		);
	}

	async function changePwd(db) {
		return db;
	}

	async function query(db) {
		return graphql(
			schema,
			'{Users{_id, preferences{defaultLanguage}, userId}}',
			db
		);
	}

	// =====***************************** User Creation Request Starts From Here********************** ====

	async function createRequest(db, data) {
		return graphql(
			schema,
			`
				mutation(
					$id: ID
					$userId: String
					$state: String
					$publishers: [String]
					$givenName: String
					$familyName: String
					$email: String
					$notes: [String]
					$lastUpdated: LastUpdatedInput
				) {
					createRequest(
						_id: $id
						userId: $userId
						state: $state
						publishers: $publishers
						givenName: $givenName
						familyName: $familyName
						email: $email
						notes: $notes
						lastUpdated: $lastUpdated
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
			{db, data}
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
				mutation(
					$userId: String
					$state: String
					$publishers: String
					$givenName: String
					$familyName: String
					$email: String
					$notes: String
					$lastUpdated: LastUpdatedInput
				) {
					updateRequest(
						userId: $userId
						state: $state
						publishers: $publishers
						givenName: $givenName
						familyName: $familyName
						email: $email
						notes: $notes
						lastUpdated: $lastUpdated
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
			{db, id, data}
		);
	}

	async function removeRequest(db, id) {
		return graphql(
			schema,
			`
				mutation($id: ID) {
					deleteRequest(_id: $id) {
						_id
					}
				}
			`,
			{db, id}
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
