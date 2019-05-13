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
<<<<<<< HEAD
const uuidv4 = require('uuid/v4');
=======
const objectId = require('mongodb').ObjectId;
>>>>>>> c94bb448d73e5e9be0d37648efe87d68c2e4a7bd

export default {
	Query: {
		Publishers: async db => {
			try {
<<<<<<< HEAD
				return await db
					.collection('PublisherMetadata')
					.find()
					.toArray()
					.then(res => res);
			} catch (err) {
				return err;
=======
				const result = await db.collection('PublisherMetadata').find().toArray();
				return result;
			} catch (err) {
				throw new Error(err);
>>>>>>> c94bb448d73e5e9be0d37648efe87d68c2e4a7bd
			}
		},
		Publisher: async ({db, id}) => {
			try {
<<<<<<< HEAD
				return await db
					.collection('PublisherMetadata')
					.findOne({id})
					.then(res => res);
			} catch (err) {
				return err;
=======
				const result = await db.collection('PublisherMetadata').findOne(objectId(id));
				return result;
			} catch (err) {
				throw new Error(err);
>>>>>>> c94bb448d73e5e9be0d37648efe87d68c2e4a7bd
			}
		},
		PublisherRequest: async ({db, id}) => {
			try {
<<<<<<< HEAD
				return await db
					.collection('PublisherRequest')
					.findOne({id})
					.then(res => res);
			} catch (err) {
				return err;
=======
				const result = await db.collection('PublisherRequest').findOne(objectId(id));
				return result;
			} catch (err) {
				throw new Error(err);
>>>>>>> c94bb448d73e5e9be0d37648efe87d68c2e4a7bd
			}
		},
		PublisherRequests: async db => {
			try {
<<<<<<< HEAD
				return await db
					.collection('PublisherRequest')
					.find()
					.toArray()
					.then(res => res);
			} catch (err) {
				return err;
=======
				const result = await db.collection('PublisherRequest').find().toArray();
				return result;
			} catch (err) {
				throw new Error(err);
>>>>>>> c94bb448d73e5e9be0d37648efe87d68c2e4a7bd
			}
		}
	},

	Mutation: {
<<<<<<< HEAD
		createPublisher: async ({db, user}) => {
			try {
				const newPublisher = {
					...user,
					id: uuidv4(),
=======
		createPublisher: async ({db, data}) => {
			try {
				const newPublisher = {
					...data,
>>>>>>> c94bb448d73e5e9be0d37648efe87d68c2e4a7bd
					lastUpdated: {
						timestamp: new Date(),
						user: 'foobar'
					}
				};
<<<<<<< HEAD
				await db
					.collection('PublisherMetadata')
					.insertOne(newPublisher)
					.then(res => res);
			} catch (err) {
				return err;
			}
		},

		updatePublisher: async ({db, id, publisher}) => {
			try {
				const publisherUpdate = {
					...publisher,
=======
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
>>>>>>> c94bb448d73e5e9be0d37648efe87d68c2e4a7bd
					lastUpdated: {
						timestamp: new Date(),
						user: 'foobar'
					}
				};
<<<<<<< HEAD
				await db
					.collection('PublisherMetadata')
					.findOneAndUpdate({id}, {$set: publisherUpdate}, {upsert: true})
					.then(res => res)
					.catch(err => err);
			} catch (err) {
				return err;
=======
				await db.collection('PublisherMetadata').findOneAndUpdate({_id: objectId(id)}, {$set: publisherUpdate}, {upsert: true});
				return await db.collection('PublisherMetadata').findOne(objectId(id));
			} catch (err) {
				throw new Error(err);
>>>>>>> c94bb448d73e5e9be0d37648efe87d68c2e4a7bd
			}
		},

		deletePublisher: async ({db, id}) => {
			try {
<<<<<<< HEAD
				const deletedPublisher = await db
					.collection('PublisherMetadata')
					.findOneAndDelete({id})
					.then(res => res.send('User Deleted'))
					.catch(err => err);
				return deletedPublisher;
			} catch (err) {
				return err;
			}
		},

		createPublisherRequests: async ({db, requests}) => {
			try {
				const newPublisherRequests = {
					...requests,
					id: uuidv4(),
=======
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
>>>>>>> c94bb448d73e5e9be0d37648efe87d68c2e4a7bd
					lastUpdated: {
						timestamp: new Date(),
						user: 'foobar'
					}
				};
<<<<<<< HEAD
				return await db
					.collection('PublisherRequest')
					.insertOne(newPublisherRequests)
					.then(res => res.ops[0])
					.catch(err => err);
			} catch (err) {
				return err;
=======
				const result = await db.collection('PublisherRequest').insertOne(newPublisherRequests);
				return result.ops[0];
			} catch (err) {
				throw new Error(err);
>>>>>>> c94bb448d73e5e9be0d37648efe87d68c2e4a7bd
			}
		},
		deletePublisherRequest: async ({db, id}) => {
			try {
<<<<<<< HEAD
				return await db
					.collection('PublisherRequest')
					.findOneAndDelete({id})
					.then(res => res.value)
					.catch(err => err);
			} catch (err) {
				return err;
			}
		},
		updatePublisherRequest: async ({db, id, body}) => {
			try {
				const publisherRequestUpdate = {
					...body,
=======
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
>>>>>>> c94bb448d73e5e9be0d37648efe87d68c2e4a7bd
					lastUpdated: {
						timestamp: new Date(),
						user: 'foobar'
					}
				};
<<<<<<< HEAD
				return await db
					.collection('PublisherRequest')
					.findOneAndUpdate(
						{id},
						{$set: publisherRequestUpdate},
						{upsert: true}
					)
					.then(() => {
						return db.collection('PublisherRequest')
							.findOne({id})
							.then(res => res);
					})
					.catch(err => err);
			} catch (err) {
				return err;
=======
				await db.collection('PublisherRequest').findOneAndUpdate({_id: objectId(id)}, {$set: publisherRequestUpdate}, {upsert: true});
				return await db.collection('PublisherRequest').findOne(objectId(id));
			} catch (err) {
				throw new Error(err);
>>>>>>> c94bb448d73e5e9be0d37648efe87d68c2e4a7bd
			}
		}
	}
};
