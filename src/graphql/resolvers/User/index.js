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
	Query: {
		userMetadata: async ({db, id}) => {
			try {
				return await db
					.collection('userMetadata')
					.findOne(objectId(id))
					.then(res => res);
			} catch (err) {
				return err;
			}
		},

		Users: async db => {
			try {
				return await db
					.collection('userMetadata')
					.find()
					.toArray()
					.then(res => res);
			} catch (err) {
				return err;
			}
		},

		usersRequest: async ({db, id}) => {
			try {
				return await db
					.collection('usersRequest')
					.findOne(objectId(id))
					.then(res => res);
			} catch (err) {
				return err;
			}
		},

		usersRequests: async db => {
			try {
				return await db
					.collection('usersRequest')
					.find()
					.toArray()
					.then(res => res);
			} catch (err) {
				return err;
			}
		}
	},

	Mutation: {
		createUser: async ({db, data}) => {
			try {
				const newUser = {
					...data,
					lastUpdated: {
						timestamp: `${date.toISOString()}`,
						user: data.lastUpdated.user
					}
				};
				const createdResponse = await db
					.collection('userMetadata')
					.insertOne(newUser)
					.then(res => res.ops);
				return createdResponse[0];
			} catch (err) {
				return err;
			}
		},

		deleteUser: async ({db, id}) => {
			try {
				const deletedUser = await db
					.collection('userMetadata')
					.findOneAndDelete({_id: objectId(id)})
					.then(res => res.value);
				return deletedUser;
			} catch (err) {
				return err;
			}
		},

		updateUser: async ({db, id, data}) => {
			try {
				const updateUser = {
					...data,
					lastUpdated: {
						timestamp: `${date.toISOString()}`,
						user: data.lastUpdated.user
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

		createRequest: async ({db, data}) => {
			try {
				const newUserRequest = {
					...data,
					lastUpdated: {
						timestamp: `${date.toISOString()}`,
						user: data.lastUpdated.user
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

		deleteRequest: async ({db, id}) => {
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

		updateRequest: async ({db, id, data}) => {
			try {
				const updateRequest = {
					...data,
					lastUpdated: {
						timestamp: `${date.toISOString()}`,
						user: data.lastUpdated.user
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
	}
};
