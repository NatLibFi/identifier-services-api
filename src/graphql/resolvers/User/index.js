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

const date = new Date();
const objectId = require('mongodb').ObjectId;

export default {
	userMetadata: async ({id}, db) => {
		try {
			const result = await db
				.collection('userMetadata')
				.findOne(objectId(id));
			return result;
		} catch (err) {
			return err;
		}
	},

	Users: async (root, db) => {
		try {
			const result = await db
				.collection('userMetadata')
				.find()
				.toArray();
			return result;
		} catch (err) {
			return err;
		}
	},

	usersRequest: async ({id}, db) => {
		try {
			const result = await db
				.collection('usersRequest')
				.findOne(objectId(id));
			return result;
		} catch (err) {
			return err;
		}
	},

	UsersRequests: async (root, db) => {
		try {
			const result = await db
				.collection('usersRequest')
				.find()
				.toArray();
			return result;
		} catch (err) {
			return err;
		}
	},

	/// ***************** */Mutation  Starts Here*********************

	createUser: async ({inputUser}, db) => {
		try {
			const newUser = {...inputUser, lastUpdated: {
				timestamp: `${date.toISOString()}`,
				user: 'user'
			}};
			const createdResponse = await db
				.collection('userMetadata')
				.insertOne(newUser);
			return createdResponse.ops[0];
		} catch (err) {
			return err;
		}
	},

	deleteUser: async ({id}, db) => {
		try {
			const deletedUser = await db
				.collection('userMetadata')
				.findOneAndDelete({_id: objectId(id)});
			return deletedUser.value;
		} catch (err) {
			return err;
		}
	},

	updateUser: async ({inputUser, id}, db) => {
		try {
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
			return await db.collection('userMetadata').findOne(objectId(id));
		} catch (err) {
			return err;
		}
	},

	createRequest: async ({inputUserRequest}, db) => {
		try {
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
		} catch (err) {
			return err;
		}
	},
	deleteRequest: async ({id}, db) => {
		try {
			const deletedRequest = await db
				.collection('usersRequest')
				.findOneAndDelete({_id: objectId(id)})
				.then(res => res.value);
			return deletedRequest;
		} catch (err) {
			return err;
		}
	},
	updateRequest: async ({inputUserRequest, id}, db) => {
		try {
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
		} catch (err) {
			return err;
		}
	}
};
