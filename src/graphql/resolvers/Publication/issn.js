/* eslint-disable camelcase */
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
		publication_ISSN: async ({db, params}) => {
			try {
				return await db
					.collection('Publication_ISSN')
					.findOne(params)
					.then(res => res);
			} catch (err) {
				return err;
			}
		},

		Publications_ISSN: async db => {
			try {
				return await db
					.collection('Publication_ISSN')
					.find()
					.toArray()
					.then(res => res);
			} catch (err) {
				return err;
			}
		},

		publicationRequest_ISSN: async ({db, params}) => {
			try {
				return await db
					.collection('PublicationRequest_ISSN')
					.findOne(params)
					.then(res => res);
			} catch (err) {
				return err;
			}
		}
	},

	Mutation: {
		createPublicationIssn: async ({db, req}) => {
			try {
				const newPublication = {
					...req.body,
					lastUpdated: {
						timestamp: `${date.toISOString()}`,
						user: req.body.lastUpdated.user
					}
				};
				const createdPublication = await db
					.collection('Publication_ISSN')
					.insertOne(newPublication)
					.then(res => res.ops);
				return createdPublication[0];
			} catch (err) {
				return err;
			}
		},

		deletePublicationIssn: async ({db, params}) => {
			try {
				const deletedUser = await db
					.collection('Publication_ISSN')
					.findOneAndDelete({id: params.id})
					.then(res => res.value);
				return deletedUser;
			} catch (err) {
				return err;
			}
		},

		updatePublicationIssn: async ({db, req}) => {
			try {
				const updatePublication = {
					...req.body,
					id: req.params.id,
					lastUpdated: {
						timestamp: `${date.toISOString()}`,
						user: req.body.lastUpdated.user
					}
				};
				await db
					.collection('Publication_ISSN')
					.findOneAndUpdate(
						{id: req.params.id},
						{$set: updatePublication},
						{upsert: true}
					);
				return updatePublication;
			} catch (err) {
				return err;
			}
		}
	}
};
