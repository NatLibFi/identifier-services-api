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

export default {
	Query: {
		template: async ({db, params}) => {
			try {
				return await db
					.collection('MessageTemplate')
					.findOne(params)
					.then(res => res);
			} catch (err) {
				return err;
			}
		},

		Templates: async ({db, req}) => {
			try {
				return await db
					.collection('MessageTemplate')
					.find()
					.toArray()
					.then(res => res);
			} catch (err) {
				return CustomElementRegistry;
			}
		}
	},

	Mutation: {
		createTemplate: async ({db, req}) => {
			try {
				const newTemplate = {
					...req.body,
					lastUpdated: {
						timestamp: `${date.toISOString()}`,
						user: req.body.lastUpdated.user
					}
				};
				const createdTemplate = await db
					.collection('MessageTemplate')
					.insertOne(newTemplate)
					.then(res => res.ops);
				return createdTemplate[0];
			} catch (err) {
				return err;
			}
		},
		updateTemplate: async ({db, req}) => {
			try {
				const updateTemplate = {
					...req.body,
					id: req.params.id,
					lastUpdated: {
						timestamp: `${date.toISOString()}`,
						user: req.body.lastUpdated.user
					}
				};
				await db
					.collection('MessageTemplate')
					.findOneAndUpdate(
						{id: req.params.id},
						{$set: updateTemplate},
						{upsert: true}
					);
				return updateTemplate;
			} catch (err) {
				return err;
			}
		},

		deleteTemplate: async ({db, params}) => {
			try {
				const deletedUser = await db
					.collection('MessageTemplate')
					.findOneAndDelete({id: params.id})
					.then(res => res.value);
				return deletedUser;
			} catch (err) {
				return err;
			}
		}
	}
};
