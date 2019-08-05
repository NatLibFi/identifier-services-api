
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

const {MongoClient, ObjectId} = require('mongodb');
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

	return {create};

	async function create(db, doc, user) {
		console.log(user);
		validateDoc(doc);

		const {insertedId} = await db.collection(collectionName).insertOne({
			...doc,
			lastUpated: moment().format(),
			user: user.id
		});
		return insertedId.toString();
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
