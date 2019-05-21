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
	publication_ISBN_ISMN: async ({id}, db) => {
		try {
			const result = await db
				.collection('Publication_ISBN_ISMN')
				.findOne(objectId(id));
			return result;
		} catch (err) {
			return err;
		}
	},

	Publications_ISBN_ISMN: async (root, db) => {
		try {
			const result = await db
				.collection('Publication_ISBN_ISMN')
				.find()
				.toArray();
			return result;
		} catch (err) {
			return err;
		}
	},

	publicationRequest_ISBN_ISMN: async ({id}, db) => {
		try {
			const result = await db
				.collection('PublicationRequest_ISBN_ISMN')
				.findOne(objectId(id));
			return result;
		} catch (err) {
			return err;
		}
	},

	PublicationRequests_ISBN_ISMN: async db => {
		try {
			const result = await db
				.collection('PublicationRequest_ISBN_ISMN')
				.find()
				.toArray();
			return result;
		} catch (err) {
			return err;
		}
	},

	createPublicationIsbnIsmn: async ({input}, db) => {
		try {
			const newPublication = {
				...input,
				lastUpdated: {
					timestamp: `${date.toISOString()}`,
					user: 'user'
				}
			};
			const result = await db
				.collection('Publication_ISBN_ISMN')
				.insertOne(newPublication);
			return result.ops[0];
		} catch (err) {
			return err;
		}
	},

	deletePublicationIsbnIsmn: async ({id}, db) => {
		try {
			const deletedPublication = await db
				.collection('Publication_ISBN_ISMN')
				.findOneAndDelete({_id: objectId(id)});
			return deletedPublication.value;
		} catch (err) {
			return err;
		}
	},

	updatePublicationIsbnIsmn: async ({id, input}, db) => {
		try {
			const updatePublication = {
				...input,
				lastUpdated: {
					timestamp: `${date.toISOString()}`,
					user: 'user'
				}
			};
			await db
				.collection('Publication_ISBN_ISMN')
				.findOneAndUpdate(
					{_id: objectId(id)},
					{$set: updatePublication},
					{upsert: true}
				);
			return await db.collection('Publication_ISBN_ISMN').findOne(objectId(id));
		} catch (err) {
			return err;
		}
	},

	createPublicationRequestIsbnIsmn: async ({input}, db) => {
		try {
			const newPublicationRequest = {
				...input,
				lastUpdated: {
					timestamp: `${date.toISOString()}`,
					user: 'user'
				}
			};
			const result = await db
				.collection('PublicationRequest_ISBN_ISMN')
				.insertOne(newPublicationRequest);
			return result.ops[0];
		} catch (err) {
			return err;
		}
	},

	updatePublicationRequestIsbnIsmn: async ({id, input}, db) => {
		try {
			const updatePublicationRequest = {
				...input,
				lastUpdated: {
					timestamp: `${date.toString()}`,
					user: input.lastUpdated.user
				}
			};
			await db
				.collection('PublicationRequest_ISBN_ISMN')
				.findOneAndUpdate(
					{_id: objectId(id)},
					{$set: updatePublicationRequest},
					{upsert: true}
				);
			const result = await db.collection('PublicationRequest_ISBN_ISMN').findOne(objectId(id));
			return result;
		} catch (err) {
			return err;
		}
	},

	deletePublicationRequestIsbnIsmn: async ({id}, db) => {
		try {
			const deletedPublicationRequest = await db
				.collection('PublicationRequest_ISBN_ISMN')
				.findOneAndDelete({_id: objectId(id)})
				.then(res => res.value);
			return deletedPublicationRequest;
		} catch (err) {
			return err;
		}
	}
};
