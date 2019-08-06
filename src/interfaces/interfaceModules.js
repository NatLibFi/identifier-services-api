/* eslint-disable no-shadow-restricted-names */
/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file.
 *
 * API microservice of Melinda record batch import system
 *
 * Copyright (C) 2018-2019 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of melinda-record-import-api
 *
 * melinda-record-import-api program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * melinda-record-import-api is distributed in the hope that it will be useful,
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

const {ObjectId} = require('mongodb');
const Ajv = require('ajv');
const moment = require('moment');
const {readFileSync} = require('fs');

export default function (collectionName, collectionContent) {
	const QUERY_LIMIT = 5;
	const PROJECTION = {
		_id: 0
	};

	const validate = getValidator(collectionContent);

	return {
		create,
		read,
		update,
		query
	};

	async function create(db, doc, user) {
		validateDoc(doc);

		const {insertedId} = await db.collection(collectionName).insertOne({
			...doc,
			lastUpdated: {
				timestamp: moment().format(),
				user: user.id
			}
		});

		return insertedId.toString();
	}

	async function read(db, id) {
		const doc = await db.collection(collectionName).findOne({
			_id: new ObjectId(id)
		}, {
			projection: PROJECTION
		});

		return doc;
	}

	async function update(db, id, doc, user) {
		validateDoc(format(doc));

		await db.collection(collectionName).findOneAndReplace({
			_id: new ObjectId(id)
		}, {
			...doc,
			lastUpdated: {
				timestamp: moment().format(),
				user: user.id
			}
		});

		function format(obj) {
			return Object.keys(obj)
				.filter(k => !['lastUpdated', 'user'].includes(k))
				.reduce((acc, k) => {
					return {...acc, [k]: obj[k]};
				}, {});
		}
	}

	async function query(db, {query, offset}) {
		if (offset) {
			return doQuery({
				...formatQuery(),
				$and: [{
					_id: {$gt: new ObjectId(offset)}
				}]
			});                        
		}

		return doQuery(formatQuery());

		async function doQuery(query) {
			return new Promise(async resolve => {
				const results = [];
				const cursor = await db.collection(collectionName)
					.find(query)
					.limit(QUERY_LIMIT);
				cursor.on('data', processData);
				cursor.on('end', () => {
					if (results.length > 0) {
						resolve({
							results,
							offset: results.slice(-1).shift().id
						});
					} else {
						resolve({results});
					}
				});

				function processData(doc) {
					doc.id = doc._id.toString();
					delete doc._id;
					results.push(doc);
				}
			});
		}

		function formatQuery() {
			return Object.keys(query).reduce((acc, key) => {
				switch (typeof query[key]) {
					case 'string':
						return {...acc, [key]: {
							$regex: query[key],
							$options: 'i'
						}};
					case 'number':
						return {...acc, [key]: query[key]};
					default:
						throw new Error('Invalid query');
				}
			}, {});
		}
	}

	function validateDoc(doc) {
		if (!validate(doc)) {
			throw new Error(JSON.stringify(validate.errors, undefined, 2));
		}
	}

	function getValidator(schemaName) {
		const str = readFileSync('src/api.json', 'utf8')
			.replace(new RegExp('#/components/schemas', 'gm'), 'defs#/definitions');

		const obj = JSON.parse(str);

		return new Ajv({allErrors: true})
			.addSchema({
				$id: 'defs',
				definitions: obj.components.schemas
			})
			.compile(obj.components.schemas[schemaName]);
	}
}
