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
const uuidv4 = require('uuid/v4');

export default {
	Query: {
		Publishers: async db => {
			try {
				return await db
					.collection('PublisherMetadata')
					.find()
					.toArray()
					.then(res => res);
			} catch (err) {
				return err;
			}
		},
		Publisher: async ({db, id}) => {
			try {
				return await db
					.collection('PublisherMetadata')
					.findOne({id})
					.then(res => res);
			} catch (err) {
				return err;
			}
		}
	},

	Mutation: {
		createPublisher: async ({db, user}) => {
			try {
				const newPublisher = {
					...user,
					id: uuidv4(),
					lastUpdated: {
						timestamp: new Date(),
						user: 'foobar'
					}
				};
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
					lastUpdated: {
						timestamp: new Date(),
						user: 'foobar'
					}
				};
				await db
					.collection('PublisherMetadata')
					.findOneAndUpdate({id}, {$set: publisherUpdate}, {upsert: true})
					.then(res => res)
					.catch(err => err);
			} catch (err) {
				return err;
			}
		},

		deletePublisher: async ({db, id}) => {
			try {
				const deletedPublisher = await db
					.collection('PublisherMetadata')
					.findOneAndDelete({id})
					.then(res => res.send('User Deleted'))
					.catch(err => err);
				return deletedPublisher;
			} catch (err) {
				return err;
			}
		}
	}
};
