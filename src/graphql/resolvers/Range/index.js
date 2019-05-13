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
		// ISBN Query
		ISBN: async ({db, id}) => {
			try {
<<<<<<< HEAD
				const resul = await db.collection('IdentifierRangesISBN');
				return resul.findOne({id});
			} catch (err) {
				return err;
=======
				return await db.collection('IdentifierRangesISBN')
					.findOne({id}).then(res => res);
			} catch (err) {
				throw new Error(err);
>>>>>>> c94bb448d73e5e9be0d37648efe87d68c2e4a7bd
			}
		},
		ISBNs: async db => {
			try {
				return await db
					.collection('IdentifierRangesISBN')
					.find()
					.toArray()
					.then(res => res);
			} catch (err) {
				return err;
			}
		},
		// ISMN Query
		ISMN: async ({db, id}) => {
			try {
				return await db
					.collection('IdentifierRangesISMN')
					.findOne({id})
					.then(res => res);
			} catch (err) {
				return err;
			}
		},
		ISMNs: async db => {
			try {
				return await db
					.collection('IdentifierRangesISMN')
					.find()
					.toArray()
					.then(res => res);
			} catch (err) {
				return err;
			}
		},
		// ISSN Query
		ISSN: async ({db, id}) => {
			try {
				return await db
					.collection('IdentifierRangesISSN')
					.findOne({id})
					.then(res => res);
			} catch (err) {
				return err;
			}
		},
		ISSNs: async db => {
			try {
				return await db
					.collection('IdentifierRangesISSN')
					.find()
					.toArray()
					.then(res => res);
			} catch (err) {
				return err;
			}
		}
	},
	Mutation: {
		// ISBN Mutation
		createISBN: async ({db, isbnData}) => {
			try {
				const newISBN = {
					id: uuidv4(),
					...isbnData,
					lastUpdated: {
						timestamp: new Date(),
						user: 'foobar'
					}
				};
				return await db
					.collection('IdentifierRangesISBN')
					.insertOne(newISBN)
					.then(res => res.ops[0]);
			} catch (err) {
				return err;
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
				return await db
					.collection('IdentifierRangesISBN')
					.findOneAndUpdate({id}, {$set: isbnUpdate}, {upsert: true})
					.then(() => {
						return db
							.collection('IdentifierRangesISBN')
							.findOne({id})
							.then(res => res);
					})
					.catch(err => err);
			} catch (err) {
				return err;
			}
		},
		// ISMN Mutation
		createISMN: async ({db, data}) => {
			try {
				const newISMN = {
					id: uuidv4(),
					...data,
					lastUpdated: {
						timestamp: new Date(),
						user: 'foobar'
					}
				};
				return await db
					.collection('IdentifierRangesISMN')
					.insertOne(newISMN)
					.then(res => res.ops[0]);
			} catch (err) {
				return err;
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
				return await db
					.collection('IdentifierRangesISMN')
					.findOneAndUpdate({id}, {$set: ismnUpdate}, {upsert: true})
					.then(() => {
						return db
							.collection('IdentifierRangesISMN')
							.findOne({id})
							.then(res => res);
					})
					.catch(err => err);
			} catch (err) {
				return err;
			}
		},
		// ISSN Mutation
		createISSN: async ({db, data}) => {
			try {
				const newISSN = {
					id: uuidv4(),
					...data,
					lastUpdated: {
						timestamp: new Date(),
						user: 'foobar'
					}
				};
				return await db
					.collection('IdentifierRangesISSN')
					.insertOne(newISSN)
					.then(res => res.ops[0]);
			} catch (err) {
				return err;
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
				return await db
					.collection('IdentifierRangesISSN')
					.findOneAndUpdate({id}, {$set: issnUpdate}, {upsert: true})
					.then(() => {
						return db
							.collection('IdentifierRangesISSN')
							.findOne({id})
							.then(res => res);
					})
					.catch(err => err);
			} catch (err) {
				return err;
			}
		}
	}
};
