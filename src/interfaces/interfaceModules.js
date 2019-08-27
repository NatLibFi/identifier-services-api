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
const path = require('path');

export default function (collectionName, collectionContent) {
	const QUERY_LIMIT = 5;

	const validate = getValidator(collectionContent);

	return {
		create,
		read,
		update,
		remove,
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

	async function read(db, id, protectedProperties) {
		const doc = await db.collection(collectionName).findOne({
			_id: new ObjectId(id)
		}, {
			projection: protectedProperties
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

	async function remove(db, id) {
		await db.collection(collectionName).findOneAndDelete({
			_id: new ObjectId(id)
		});
	}

	async function query(db, {queries, offset}) {
		if (offset) {
			if (queries.length > 0) {
				const result = await queries.reduce((acc, {query}) => {
					return doQuery({
						...formatQuery(query),
						$and: [{
							_id: {$gt: new ObjectId(offset)}
						}]
					});
				}, []);
				return result;
			}

			return doQuery({
				...formatQuery(query),
				$and: [{
					_id: {$gt: new ObjectId(offset)}
				}]
			});
		}

		const result = queries.reduce((acc, {query}) => {
			return doQuery(formatQuery(query));
		}, []);
		return result;

		async function doQuery(query) {
			const results = [];
			const totalDoc = await db.collection(collectionName).find({}).count();
			const cursor = await db.collection(collectionName)
				.find(query)
				.limit(QUERY_LIMIT);
			const queryDocCount = await cursor.count();
			return new Promise(resolve => {
				cursor.on('data', processData);
				cursor.on('end', () => {
					if (results.length > 0) {
						resolve({
							results,
							offset: results.slice(-1).shift().id,
							totalDoc: totalDoc,
							queryDocCount: queryDocCount
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

		function formatQuery(query) {
			if (Object.keys(query).length === 0) {
				return query;
			}

			return Object.keys(query).reduce((acc, key) => {
				if (key === '$or') {
					const propertyQueries = query[key].map(o => {
						const [key, value] = Object.entries(o).shift();
						return convert(key, value);
					});
					return {
						...acc,
						$or: propertyQueries
					};
				}

				const propertyQuery = convert(key, query[key]);
				return {
					...acc,
					$and: '$and' in acc ? acc.$and.concat(propertyQuery) : [propertyQuery]
				};
				function convert(key, value) {
					if (typeof value === 'object') {
						if (Array.isArray(value)) {
							return {
								[key]: {
									$in: value.map(getComparisonOperator)
								}
							};
						}

						const [key1, value1] = Object.entries(value).shift();
						return {[`${key}.${key1}`]: value1};
						// Doesnot support at this moment
						// return {
						// 	[key]: Object.entries(value).reduce((acc, [subKey, subValue]) => {
						// 		return {
						// 			...acc,
						// 			[subKey]: getComparisonOperator(subValue)
						// 		}
						// 	}, {})
						// };
					}

					return {
						[key]: getComparisonOperator(value)
					};

					function getComparisonOperator(value) {
						switch (typeof value) {
							case 'string':
								return {$regex: value, $options: 'i'};
							case 'boolean':
							case 'number':
								return value;
							default:
								throw new Array('Invalid query');
						}
					}
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
		const str = readFileSync(path.join(__dirname, '..', 'api.json'), 'utf8')
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
