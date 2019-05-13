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

const objectId = require('mongodb').ObjectId;
const date = new Date();

export default {
	Query: {
		publication_ISSN: async ({db, id}) => {
			try {
				const result = await db
					.collection('Publication_ISSN')
					.findOne(objectId(id));
				return result;
			} catch (err) {
				return err;
			}
		},

		Publications_ISSN: async db => {
			try {
				const result = await db
					.collection('Publication_ISSN')
					.find()
					.toArray();
				return result;
			} catch (err) {
				return err;
			}
		},

		publicationRequest_ISSN: async ({db, id}) => {
			try {
				const result = await db
					.collection('PublicationRequest_ISSN')
					.findOne(objectId(id));
				return result;
			} catch (err) {
				return err;
			}
		}
	},

	Mutation: {
		createPublicationIssn: async ({db, data}) => {
			try {
				const newPublication = {
					...data,
					lastUpdated: {
						timestamp: `${date.toISOString()}`,
						user: data.lastUpdated.user
					}
				};
				const result = await db
					.collection('Publication_ISSN')
					.insertOne(newPublication);
				return result.ops[0];
			} catch (err) {
				return err;
			}
		},

		deletePublicationIssn: async ({db, id}) => {
			try {
				const deletedPublication = await db
					.collection('Publication_ISSN')
					.findOneAndDelete({_id: objectId(id)});
				return deletedPublication.value;
			} catch (err) {
				return err;
			}
		},

		updatePublicationIssn: async ({db, id, data}) => {
			console.log(id);
			try {
				const updatePublication = {
					...data,
					lastUpdated: {
						timestamp: `${date.toISOString()}`,
						user: data.lastUpdated.user
					}
				};
				await db
					.collection('Publication_ISSN')
					.findOneAndUpdate(
						{_id: objectId(id)},
						{$set: updatePublication},
						{upsert: true}
					);
				return await db
					.collection('Publication_ISSN')
					.findOne(objectId(id));
			} catch (err) {
				return err;
			}
		},

		createPublicationRequestIssn: async ({db, data}) => {
			try {
				const newPublicationRequest = {
					...data,
					lastUpdated: {
						timestamp: `${date.toISOString()}`,
						user: data.lastUpdated.user
					}
				};
				const result = await db
					.collection('PublicationRequest_ISSN')
					.insertOne(newPublicationRequest);
				return result.ops[0];
			} catch (err) {
				return err;
			}
		},

		updatePublicationRequestIssn: async ({db, id, data}) => {
			try {
				const updatePublicationRequest = {
					...data,
					lastUpdated: {
						timestamp: `${date.toISOString()}`,
						user: data.lastUpdated.user
					}
				};
				await db
					.collection('PublicationRequest_ISSN')
					.findOneAndUpdate(
						{_id: objectId(id)},
						{$set: updatePublicationRequest},
						{upsert: true}
					);
				return await db
					.collection('PublicationRequest_ISSN')
					.findOne(objectId(id));
			} catch (err) {
				return err;
			}
		},

		deletePublicationRequestIssn: async ({db, id}) => {
			try {
				const deletedPublicationRequest = await db
					.collection('PublicationRequest_ISSN')
					.findOneAndDelete({_id: objectId(id)});
				return deletedPublicationRequest.value;
			} catch (err) {
				return err;
			}
		}

	}
};
