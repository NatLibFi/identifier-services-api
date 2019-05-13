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
const objectId = require('mongodb').ObjectId;
const date = new Date();

export default {
	Query: {
		template: async ({db, id}) => {
			try {
				const result = await db
					.collection('MessageTemplate')
					.findOne(objectId(id));
				return result;
			} catch (err) {
				return err;
			}
		},

		Templates: async ({db}) => {
			try {
				const result = await db
					.collection('MessageTemplate')
					.find()
					.toArray();
				return result;
			} catch (err) {
				return err;
			}
		}
	},

	Mutation: {
		createTemplate: async ({db, data}) => {
			try {
				const newTemplate = {
					...data,
					lastUpdated: {
						timestamp: `${date.toISOString()}`,
						user: data.lastUpdated.user
					}
				};
				const result = await db
					.collection('MessageTemplate')
					.insertOne(newTemplate);
					console.log(result)
				return result.ops[0];
			} catch (err) {
				return err;
			}
		},
		updateTemplate: async ({db, id, data}) => {
			try {
				const updateTemplate = {
					...data,
					lastUpdated: {
						timestamp: `${date.toISOString()}`,
						user: data.lastUpdated.user
					}
				};
				await db
					.collection('MessageTemplate')
					.findOneAndUpdate(
						{_id: objectId(id)},
						{$set: updateTemplate},
						{upsert: true}
					);
				return db
					.collection('MessageTemplate')
					.findOne(objectId(id));
			} catch (err) {
				return err;
			}
		},

		deleteTemplate: async ({db, id}) => {
			try {
				const deletedUser = await db
					.collection('MessageTemplate')
					.findOneAndDelete({_id: objectId(id)});
				return deletedUser.value;
			} catch (err) {
				return err;
			}
		}
	}
};
