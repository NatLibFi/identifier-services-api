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
	// ISBN Query
	ISBN: async (undefined, ctx) => {
		const {id, db} = ctx;
		try {
			if (!objectId.isValid(id)) {
				throw new Error('ISBN doesnot exists');
			}

			return await db.collection('IdentifierRangesISBN').findOne(objectId(id)).then(res => res);
		} catch (err) {
			return err;
		}
	},
	ISBNs: async (undefined, db) => {
		try {
			return await db.collection('IdentifierRangesISBN').find().toArray();
		} catch (err) {
			return err;
		}
	},
	// ISMN Query
	ISMN: async (undefined, ctx) => {
		const {id, db} = ctx;
		try {
			if (!objectId.isValid(id)) {
				throw new Error('ISMN doesnot exists');
			}

			return await db.collection('IdentifierRangesISMN').findOne(objectId(id));
		} catch (err) {
			return err;
		}
	},
	ISMNs: async (undefined, db) => {
		try {
			return await db.collection('IdentifierRangesISMN').find().toArray();
		} catch (err) {
			return err;
		}
	},
	// ISSN Query
	ISSN: async (undefined, ctx) => {
		const {id, db} = ctx;
		try {
			if (!objectId.isValid(id)) {
				throw new Error('ISSN doesnot exists');
			}

			return await db.collection('IdentifierRangesISSN').findOne(objectId(id));
		} catch (err) {
			return err;
		}
	},
	ISSNs: async (undefined, db) => {
		try {
			return await db
				.collection('IdentifierRangesISSN').find().toArray();
		} catch (err) {
			return err;
		}
	},

	// ISBN Mutation
	createISBN: async (args, db) => {
		try {
			const newISBN = {
				...args.input,
				lastUpdated: {
					...args.input.lastUpdated,
					timestamp: new Date()
				}
			};
			const result = await db.collection('IdentifierRangesISBN').insertOne(newISBN);
			return result.ops[0];
		} catch (err) {
			return err;
		}
	},
	updateISBN: async (args, cxt) => {
		const {db, id} = cxt;
		try {
			if (!objectId.isValid(id)) {
				throw new Error('ISBN doesnot exists');
			}

			const isbnUpdate = {
				...args.input,
				lastUpdated: {
					...args.input.lastUpdated,
					timestamp: new Date(),
				}
			};
			await db
				.collection('IdentifierRangesISBN')
				.findOneAndUpdate({_id: objectId(id)}, {$set: isbnUpdate}, {upsert: true});
			return await db.collection('IdentifierRangesISBN').findOne(objectId(id));
		} catch (err) {
			return err;
		}
	},
	// ISMN Mutation
	createISMN: async (args, db) => {
		try {
			const newISMN = {
				...args.input,
				lastUpdated: {
					...args.input.lastUpdated,
					timestamp: new Date(),
				}
			};
			const result = await db.collection('IdentifierRangesISMN').insertOne(newISMN);
			return result.ops[0];
		} catch (err) {
			return err;
		}
	},
	updateISMN: async (args, cxt) => {
		const {db, id} = cxt;
		try {
			if (!objectId.isValid(id)) {
				throw new Error('ISMN doesnot exists');
			}

			const ismnUpdate = {
				...args.input,
				lastUpdated: {
					...args.input.lastUpdated,
					timestamp: new Date(),
				}
			};
			await db.collection('IdentifierRangesISMN').findOneAndUpdate({_id: objectId(id)}, {$set: ismnUpdate}, {upsert: true});
			return await db.collection('IdentifierRangesISMN').findOne(objectId(id));
		} catch (err) {
			return err;
		}
	},
	// ISSN Mutation
	createISSN: async (args, db) => {
		try {
			const newISSN = {
				...args.input,
				lastUpdated: {
					...args.input.lastUpdated,
					timestamp: new Date(),
				}
			};
			const result = await db.collection('IdentifierRangesISSN').insertOne(newISSN);
			return result.ops[0];
		} catch (err) {
			return err;
		}
	},
	updateISSN: async (args, cxt) => {
		const {db, id} = cxt;
		try {
			if (!objectId.isValid(id)) {
				throw new Error('ISSN doesnot exists');
			}

			const issnUpdate = {
				...args.input,
				lastUpdated: {
					...args.input.lastUpdated,
					timestamp: new Date(),
				}
			};
			await db.collection('IdentifierRangesISSN').findOneAndUpdate({_id: objectId(id)}, {$set: issnUpdate}, {upsert: true});
			return await db.collection('IdentifierRangesISSN').findOne(objectId(id));
		} catch (err) {
			return err;
		}
	}

};
