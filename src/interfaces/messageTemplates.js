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
import {convertLanguage, hasAdminPermission, hasSystemPermission} from './utils';

const objectId = require('mongodb').ObjectId;
const date = new Date();

export default function () {
	const protectedQueryReturn = `
	_id
	name
	language
	subject
	body
	notes
	lastUpdated{
		timestamp
		user
	}
	`;
	const queryReturn = `
	_id
	name
	language
	subject
	body
	`;

	return {
		create,
		read,
		remove,
		update,
		query
	};

	async function create(db, data) {
		const id = data.user.id;
		const newData = {
			...data,
			language: convertLanguage(data.language),
			body: data.description
		};
		delete newData.email;
		delete newData.description;
		delete newData.user;
		const query = `
		mutation($inputMessageTemplate: MessageTemplateInput ){
			createTemplate(inputMessageTemplate: $inputMessageTemplate){
				${queryReturn}
			}
		}
		`;

		const args = {inputMessageTemplate: newData};
		const result = await graphql(schema, query, {createTemplate}, db, args);
		if (result.errors) {
			throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY);
		}

		return result;

		async function createTemplate(args, db) {
			const newTemplate = {
				...args.inputMessageTemplate,
				lastUpdated: {
					timestamp: `${date.toISOString()}`,
					user: (id === undefined) ? 'user' : id
				}
			};
			const result = await db
				.collection('MessageTemplate')
				.insertOne(newTemplate);
			return result.ops[0];
		}
	}

	async function read(db, id, user) {
		let query;
		if(hasAdminPermission(user) || hasSystemPermission(user)){
			query = `
			{
				messageTemplate(id:${JSON.stringify(id)}){
					${protectedQueryReturn}
				}
			}
			`;
		} else {
			query = `
			{
				messageTemplate(id:${JSON.stringify(id)}){
					${queryReturn}
				}
			}
			`;
		}
			const result = await graphql(schema, query, {messageTemplate}, db, {id: id});
			if (result.data.messageTemplate === null) {
				throw new ApiError(HttpStatus.NOT_FOUND);
			}
			
			return result;

		async function messageTemplate({id}, db) {
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

	async function update(db, {id, data, user}) {
		let query;
		if(hasAdminPermission(user) || hasSystemPermission(user)){

			query = `
			mutation($id:ID, $inputTemplate:MessageTemplateInput){
				updateTemplate(id:$id, inputMessageTemplate: $inputTemplate){
					${protectedQueryReturn}
				}
			}
			`;
		} else {
			query = `
			mutation($id:ID, $inputTemplate:MessageTemplateInput){
				updateTemplate(id:$id, inputMessageTemplate: $inputTemplate){
					${queryReturn}
				}
			}
			`;

		}
		const args = {id: id, inputMessageTemplate: data};
		const result = await graphql(schema, query, {updateTemplate}, db, args);
		if (result.errors) {
			throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY);
		}

		return result;

		async function updateTemplate({inputMessageTemplate, id}, db) {
			const updateTemplate = {
				...inputMessageTemplate,
				lastUpdated: {
					timestamp: `${date.toISOString()}`,
					user: user.id
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

	async function query(db, user) {
		let query;
		if(hasAdminPermission(user) || hasSystemPermission(user)){
			query = `
				{
					MessageTemplates{
						${protectedQueryReturn}
					}
				}
				`;

		} else {
			query = `
			{
				MessageTemplates{
					${queryReturn}
				}
			}
			`;
		}

		const result = await graphql(schema, query, {MessageTemplates}, db);
			console.log(result)
		if (result.errors) {
			throw new ApiError(HttpStatus.NOT_FOUND);
		}

		return result;
	}

	async function MessageTemplates(root, db) {
		const result = await db
			.collection('MessageTemplate')
			.find()
			.toArray();
		return result;
	}
}
