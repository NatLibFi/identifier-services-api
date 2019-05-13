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
		// ISBN Query
		ISBN: async ({db, id}) => {
			try {
				return await db.collection('IdentifierRangesISBN').findOne(objectId(id)).then(res => res);
			} catch (err) {
				throw new Error(err);
			}
		},
		ISBNs: async db => {
			try {
				return await db.collection('IdentifierRangesISBN').find().toArray();
			} catch (err) {
				throw new Error(err);
			}
		},
		// ISMN Query
		ISMN: async ({db, id}) => {
			try {
				return await db.collection('IdentifierRangesISMN').findOne(objectId(id));
			} catch (err) {
				throw new Error(err);
			}
		},
		ISMNs: async db => {
			try {
				return await db.collection('IdentifierRangesISMN').find().toArray();
			} catch (err) {
				throw new Error(err);
			}
		},
		// ISSN Query
		ISSN: async ({db, id}) => {
			try {
				return await db.collection('IdentifierRangesISSN').findOne(objectId(id));
			} catch (err) {
				throw new Error(err);
			}
		},
		ISSNs: async db => {
			try {
				return await db
					.collection('IdentifierRangesISSN').find().toArray();
			} catch (err) {
				throw new Error(err);
			}
		}
	},
	Mutation: {
		// ISBN Mutation
		createISBN: async ({db, isbnData}) => {
			try {
				const newISBN = {
					...isbnData,
					lastUpdated: {
						timestamp: new Date(),
						user: 'foobar'
					}
				};
				const result = await db.collection('IdentifierRangesISBN').insertOne(newISBN);
				return result.ops[0];
			} catch (err) {
				throw new Error(err);
			}
		},
		updateISBN: async ({db, id, data}) => {
			try {
				const isbnUpdate = {
					...data,
					lastUpdated: {
						timestamp: new Date(),
						user: 'foobar'
					}
				};
				await db
					.collection('IdentifierRangesISBN')
					.findOneAndUpdate({_id: objectId(id)}, {$set: isbnUpdate}, {upsert: true});
				return await db.collection('IdentifierRangesISBN').findOne(objectId(id));

			} catch (err) {
				throw new Error(err);
			}
		},
		// ISMN Mutation
		createISMN: async ({db, data}) => {
			try {
				const newISMN = {
					...data,
					lastUpdated: {
						timestamp: new Date(),
						user: 'foobar'
					}
				};
				const result = await db.collection('IdentifierRangesISMN').insertOne(newISMN);
				return result.ops[0];
			} catch (err) {
				throw new Error(err);
			}
		},
		updateISMN: async ({db, id, data}) => {
			try {
				const ismnUpdate = {
					...data,
					lastUpdated: {
						timestamp: new Date(),
						user: 'foobar'
					}
				};
				await db.collection('IdentifierRangesISMN').findOneAndUpdate({_id: objectId(id)}, {$set: ismnUpdate}, {upsert: true})
				return await db.collection('IdentifierRangesISMN').findOne(objectId(id));
			} catch (err) {
				throw new Error(err);
			}
		},
		// ISSN Mutation
		createISSN: async ({db, data}) => {
			try {
				const newISSN = {
					...data,
					lastUpdated: {
						timestamp: new Date(),
						user: 'foobar'
					}
				};
				const result = await db.collection('IdentifierRangesISSN').insertOne(newISSN);
				return result.ops[0];
			} catch (err) {
				throw new Error(err);
			}
		},
		updateISSN: async ({db, id, data}) => {
			try {
				const issnUpdate = {
					...data,
					lastUpdated: {
						timestamp: new Date(),
						user: 'foobar'
					}
				};
				await db.collection('IdentifierRangesISSN').findOneAndUpdate({_id: objectId(id)}, {$set: issnUpdate}, {upsert: true})
				return await db.collection('IdentifierRangesISSN').findOne(objectId(id));

			} catch (err) {
				throw new Error(err);
			}
		}
	}
};
