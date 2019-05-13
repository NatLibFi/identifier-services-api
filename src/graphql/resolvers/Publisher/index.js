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

export default {
	Query: {
		Publishers: async db => {
			try {
				const result = await db.collection('PublisherMetadata').find().toArray();
				return result;
			} catch (err) {
				throw new Error(err);
			}
		},
		Publisher: async ({db, id}) => {
			try {
				const result = await db.collection('PublisherMetadata').findOne(objectId(id));
				return result;
			} catch (err) {
				throw new Error(err);
			}
		},
		PublisherRequest: async ({db, id}) => {
			try {
				const result = await db.collection('PublisherRequest').findOne(objectId(id));
				return result;
			} catch (err) {
				throw new Error(err);
			}
		},
		PublisherRequests: async db => {
			try {
				const result = await db.collection('PublisherRequest').find().toArray();
				return result;
			} catch (err) {
				throw new Error(err);
			}
		}
	},

	Mutation: {
		createPublisher: async ({db, data}) => {
			try {
				const newPublisher = {
					...data,
					lastUpdated: {
						timestamp: new Date(),
						user: 'foobar'
					}
				};
				const result = await db.collection('PublisherMetadata').insertOne(newPublisher);
				return result.ops[0];
			} catch (err) {
				throw new Error(err);
			}
		},

		updatePublisher: async ({db, id, data}) => {
			try {
				const publisherUpdate = {
					...data,
					lastUpdated: {
						timestamp: new Date(),
						user: 'foobar'
					}
				};
				await db.collection('PublisherMetadata').findOneAndUpdate({_id: objectId(id)}, {$set: publisherUpdate}, {upsert: true});
				return await db.collection('PublisherMetadata').findOne(objectId(id));
			} catch (err) {
				throw new Error(err);
			}
		},

		deletePublisher: async ({db, id}) => {
			try {
				const deletedPublisher = await db.collection('PublisherMetadata').findOneAndDelete({_id: objectId(id)});
				return deletedPublisher.value;
			} catch (err) {
				throw new Error('Publisher doesnot Exist');
			}
		},

		createPublisherRequests: async ({db, data}) => {
			try {
				const newPublisherRequests = {
					...data,
					lastUpdated: {
						timestamp: new Date(),
						user: 'foobar'
					}
				};
				const result = await db.collection('PublisherRequest').insertOne(newPublisherRequests);
				return result.ops[0];
			} catch (err) {
				throw new Error(err);
			}
		},
		deletePublisherRequest: async ({db, id}) => {
			try {
				const deletePublisherRequest = await db.collection('PublisherRequest').findOneAndDelete({_id: objectId(id)});
				return deletePublisherRequest.value;
			} catch (err) {
				throw new Error(err, 'PublisherRequest doesnot Exist');
			}
		},
		updatePublisherRequest: async ({db, id, data}) => {
			try {
				const publisherRequestUpdate = {
					...data,
					lastUpdated: {
						timestamp: new Date(),
						user: 'foobar'
					}
				};
				await db.collection('PublisherRequest').findOneAndUpdate({_id: objectId(id)}, {$set: publisherRequestUpdate}, {upsert: true});
				return await db.collection('PublisherRequest').findOne(objectId(id));
			} catch (err) {
				throw new Error(err);
			}
		}
	}
};
