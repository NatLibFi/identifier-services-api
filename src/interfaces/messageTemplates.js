/* eslint-disable new-cap */

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

const {ObjectId} = require('mongodb');
const moment = require('moment');
const {readFileSync} = require('fs');
const Ajv = require('ajv');

export default function () {
	const QUERY_LIMIT = 5;
	const collectionName = 'MessageTemplate';
	const PROJECTION = {
		_id: 0
	};

	const validate = getValidator('MessageTemplateContent');

	return {create, read, update, remove, query};

	async function create(db, doc, user) {
		console.log(user);
		validateDoc(doc);

		const {insertedId} = await db.collection(collectionName).insertOne({
			...doc,
			lastUpated: {
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

	async function update(db, id, values) {
		const {doc, user} = values;
		validateDoc(format(doc));
		const result = await db.collection(collectionName).findOneAndReplace({
			_id: ObjectId(id)
		}, {
			...doc,
			lastUpated: {
				timestamp: moment().format(),
				user: user.id
			}
		});

		return result;
		function format(obj) {
			return Object.keys(obj)
				.filter(k => !['lastUpdated', 'user'].includes(k))
				.reduce((acc, k) => {
					return {...acc, [k]: obj[k]};
				}, {});
		}
	}

	async function remove(db, id) {
		await db.collection(collectionName).findOneAndDelete({
			_id: ObjectId(id)
		});
	}

	async function query(db, {query, offset}) {
		if (offset) {
			return doQuery({
				...formatQuery(),
				$and: [{
					_id: {$gt: ObjectId(offset)}
				}]
			});
		}

		return doQuery(formatQuery());

		async function doQuery(query) {
			const cursor = await db.collection(collectionName)
				.find(query)
				.limit(parseInt(QUERY_LIMIT));

			return new Promise(resolve => {
				const results = [];

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
