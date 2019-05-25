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

import {graphql} from 'graphql';
import schema from '../graphql';
import HttpStatus from 'http-status';
import {ApiError} from '@natlibfi/identifier-services-commons';

const objectId = require('mongodb').ObjectId;
const date = new Date();

export default function () {
	const queryReturn = `
	_id
	name
	language
	subject
	body
	lastUpdated{
		timestamp
		user
	}
	`;

	return {
		create,
		read,
		remove,
		update,
		query
	};

	async function create(db, data) {
		const query = `
		mutation($inputTemplate: InputTemplate ){
			createTemplate(inputTemplate: $inputTemplate){
				${queryReturn}
			}
		}
		`;

		const args = {inputTemplate: data};
		const result = await graphql(schema, query, {createTemplate}, db, args);
		if (result.errors) {
			throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY);
		}

		return result;

		async function createTemplate({inputTemplate}, db) {
			const newTemplate = {
				...inputTemplate,
				lastUpdated: {
					timestamp: `${date.toISOString()}`,
					user: 'user'
				}
			};
			const result = await db
				.collection('MessageTemplate')
				.insertOne(newTemplate);
			return result.ops[0];
		}
	}

	async function read(db, id) {
		const query = `
				{
					template(id:${JSON.stringify(id)}){
						${queryReturn}
					}
				}
				`;
		const result = await graphql(schema, query, {template}, db, {id: id});
		if (result.data.template === null) {
			throw new ApiError(HttpStatus.NOT_FOUND);
		}

		return result;

		async function template({id}, db) {
			const result = await db
				.collection('MessageTemplate')
				.findOne(objectId(id));
			return result;
		}
	}

	async function remove(db, id) {
		const query = `
				mutation{
					deleteTemplate(id: ${JSON.stringify(id)}) {
						_id
					}
				}
				`;
		const result = await graphql(schema, query, {deleteTemplate}, db);
		if (result.err) {
			throw new ApiError(HttpStatus.NOT_FOUND);
		}

		return result;

		async function deleteTemplate({id}, db) {
			const deletedUser = await db
				.collection('MessageTemplate')
				.findOneAndDelete({_id: objectId(id)});
			return deletedUser.value;
		}
	}

	async function update(db, id, data) {
		const query = `
				mutation($id:ID, $inputTemplate:InputTemplate){
					updateTemplate(id:$id, inputTemplate: $inputTemplate){
						${queryReturn}
					}
				}
				`;
		const args = {id: id, inputTemplate: data};
		const result = await graphql(schema, query, {updateTemplate}, db, args);
		if (result.errors) {
			throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY);
		}

		return result;

		async function updateTemplate({inputTemplate, id}, db) {
			const updateTemplate = {
				...inputTemplate,
				lastUpdated: {
					timestamp: `${date.toISOString()}`,
					user: 'user'
				}
			};
			await db
				.collection('MessageTemplate')
				.findOneAndUpdate(
					{_id: objectId(id)},
					{$set: updateTemplate},
					{upsert: true}
				);
			return db
				.collection('MessageTemplate')
				.findOne(objectId(id));
		}
	}

	async function query(db) {
		const query = `
			{
				Templates{
					${queryReturn}
				}
			}
			`;

		const result = await graphql(schema, query, {Templates}, db);
		if (result.errors) {
			throw new ApiError(HttpStatus.NOT_FOUND);
		}

		return result;
	}

	async function Templates(root, db) {
		const result = await db
			.collection('MessageTemplate')
			.find()
			.toArray();
		return result;
	}
}
