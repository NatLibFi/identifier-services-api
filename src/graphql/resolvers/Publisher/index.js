/* eslint-disable no-shadow-restricted-names */
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
	Publishers: async (undefined, db) => {
		try {
			const result = await db.collection('PublisherMetadata').find().toArray();
			return result;
		} catch (err) {
			throw new Error(err);
		}
	},
	Publisher: async (undefined, ctx) => {
		const {id, db} = ctx;
		try {
			if (!objectId.isValid(id)) {
				throw new Error('Publisher doesnot exists');
			}

			const result = await db.collection('PublisherMetadata').findOne(objectId(id));
			return result;
		} catch (err) {
			return err;
		}
	},
	PublisherRequest: async (undefined, ctx) => {
		const {id, db} = ctx;
		try {
			if (!objectId.isValid(id)) {
				throw new Error('PublisherRequest doesnot exists');
			}

			const result = await db.collection('PublisherRequest').findOne(objectId(id));

			return result;
		} catch (err) {
			throw new Error(err);
		}
	},
	PublisherRequests: async (undefined, db) => {
		try {
			const result = await db.collection('PublisherRequest').find().toArray();
			return result;
		} catch (err) {
			throw new Error(err);
		}
	},

	// ***************************Mutation starts here***************************

	createPublisher: async (args, db) => {
		try {
			const newPublisher = {
				...args.input,
				lastUpdated: {
					...args.input.lastUpdated,
					timestamp: new Date()
				}
			};
			const result = await db.collection('PublisherMetadata').insertOne(newPublisher);
			return result.ops[0];
		} catch (err) {
			throw new Error(err);
		}
	},

	updatePublisher: async (args, cxt) => {
		const {db, id} = cxt;
		try {
			if (!objectId.isValid(id)) {
				throw new Error('Publisher doesnot exists');
			}

			const publisherUpdate = {
				...args.input,
				lastUpdated: {
					...args.input.lastUpdated,
					timestamp: new Date()
				}
			};
			await db.collection('PublisherMetadata').findOneAndUpdate({_id: objectId(id)}, {$set: publisherUpdate}, {upsert: true});
			return await db.collection('PublisherMetadata').findOne(objectId(id));
		} catch (err) {
			throw new Error(err);
		}
	},

	deletePublisher: async (undefined, ctx) => {
		const {id, db} = ctx;
		try {
			if (!objectId.isValid(id)) {
				throw new Error('Publisher doesnot exists');
			}

			const deletedPublisher = await db.collection('PublisherMetadata').findOneAndDelete({_id: objectId(id)});
			return deletedPublisher.value;
		} catch (err) {
			throw new Error('Publisher doesnot Exist');
		}
	},

	createPublisherRequests: async (args, db) => {
		try {
			const newPublisherRequests = {
				...args.input,
				lastUpdated: {
					...args.input.lastUpdated,
					timestamp: new Date()
				}
			};
			const result = await db.collection('PublisherRequest').insertOne(newPublisherRequests);
			return result.ops[0];
		} catch (err) {
			throw new Error(err);
		}
	},
	deletePublisherRequest: async (undefined, ctx) => {
		const {id, db} = ctx;
		try {
			if (!objectId.isValid(id)) {
				throw new Error('PublisherRequest doesnot exists');
			}

			const deletePublisherRequest = await db.collection('PublisherRequest').findOneAndDelete({_id: objectId(id)});
			return deletePublisherRequest.value;
		} catch (err) {
			throw new Error(err, 'PublisherRequest doesnot Exist');
		}
	},
	updatePublisherRequest: async (args, ctx) => {
		const {db, id} = ctx;
		try {
			if (!objectId.isValid(id)) {
				throw new Error('PublisherRequest doesnot exists');
			}

			const publisherRequestUpdate = {
				...args.input,
				lastUpdated: {
					...args.input.lastUpdated,
					timestamp: new Date()
				}
			};
			await db.collection('PublisherRequest').findOneAndUpdate({_id: objectId(id)}, {$set: publisherRequestUpdate}, {upsert: true});
			return await db.collection('PublisherRequest').findOne(objectId(id));
		} catch (err) {
			throw new Error(err);
		}
	}
};
