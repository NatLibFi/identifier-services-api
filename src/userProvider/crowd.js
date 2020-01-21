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

import HttpStatus from 'http-status';
import {ApiError, Utils} from '@natlibfi/identifier-services-commons';
import CrowdClient from 'atlassian-crowd-client';
import User from 'atlassian-crowd-client/lib/models/user';
import jose from 'jose';
import fs from 'fs';

import {hasPermission, getTemplate, validateDoc} from '../interfaces/utils';
import interfaceFactory from '../interfaces/interfaceModules';
import {mapRoleToGroup} from '../utils';
import {UI_URL, SMTP_URL} from '../config';

const userMetadataInterface = interfaceFactory('userMetadata');
const usersRequestInterface = interfaceFactory('usersRequest');
const {sendEmail} = Utils;

export default function ({CROWD_URL, CROWD_APP_NAME, CROWD_APP_PASSWORD, PRIVATE_KEY_URL, db}) {
	const crowdClient = new CrowdClient({
		baseUrl: CROWD_URL,
		application: {
			name: CROWD_APP_NAME,
			password: CROWD_APP_PASSWORD
		}
	});
	return {
		create,
		read,
		update,
		remove,
		changePwd,
		query,
		createRequest,
		readRequest,
		updateRequest,
		removeRequest,
		queryRequest
	};

	async function create(doc, user) {
		if (Object.keys(doc).length === 0) {
			throw new ApiError(HttpStatus.BAD_REQUEST);
		} else {
			if (doc.email) {
				doc.id = doc.email;
				validateDoc(doc, 'UserContent');
				if (hasPermission(user, 'users', 'create')) {
					try {
						const {crowdUser} = crowd();
						await crowdUser.create({doc: doc});
					} catch (err) {
						throw new ApiError(err.status);
					}

					const {role, givenName, userId, familyName, email, ...rest} = {...doc};
					const result = await userMetadataInterface.create(db, rest, user);
					return result;
				}

				throw new ApiError(HttpStatus.FORBIDDEN);
			}

			if (doc.userId && !doc.email) {
				const {crowdUser} = crowd();
				const allCrowdUsers = await crowdUser.query();
				const isUserExit = allCrowdUsers.includes(doc.userId);

				if (isUserExit) {
					doc.id = doc.userId;
					const {role, givenName, familyName, userId, email, ...rest} = {...doc};
					const queries = [{
						query: {id: doc.id}
					}];
					const response = await userMetadataInterface.query(db, {queries});
					if (response.results[0].id === doc.id) {
						throw new ApiError(HttpStatus.CONFLICT);
					} else {
						const result = await userMetadataInterface.create(db, rest, user);
						return result;
					}
				}

				throw new ApiError(HttpStatus.NOT_FOUND);
			}
		}
	}

	async function read(id, user) {
		const response = await userMetadataInterface.read(db, id);
		const {crowdUser} = crowd();
		const result = await crowdUser.read({id: response.userId ? response.userId : response.id});

		if (hasPermission(user, 'users', 'read')) {
			// Need to filter user information after combining and before returning to clientSide
			delete result.password;
			if (user.role === 'publisher-admin') {
				if (user.id === result.publisher || user.id === result.id) {
					return {...response, ...result};
				}

				throw new ApiError(HttpStatus.UNAUTHORIZED);
			}

			return {...response, ...result};
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function update(id, doc, user) {
		validateDoc(doc, 'UserContent');
		if (hasPermission(user, 'users', update)) {
			const result = await userMetadataInterface.update(db, id, doc, user);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function remove(id, user) {
		if (hasPermission(user, 'users', 'remove')) {
			const response = await userMetadataInterface.read(db, id);
			if (response === null) {
				throw new ApiError(HttpStatus.NOT_FOUND);
			} else {
				const {crowdUser} = crowd();
				await crowdUser.remove({id: response.userId ? response.userId : response.id});
				const result = await userMetadataInterface.remove(db, id);
				return result;
			}
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function changePwd(doc, user) {
		if (doc.newPassword) {
			if (hasPermission(user, 'users', 'changePwd')) {
				const {crowdUser} = crowd();
				await crowdUser.update({doc});
			} else {
				throw new ApiError(HttpStatus.FORBIDDEN);
			}
		} else {
			const {crowdUser} = crowd();
			const response = await crowdUser.read({id: doc.id});
			// ************ DO SOMETHING HERE NOT COMLETE ******************
			const email = response.emails[0].value;
			const result = await createLinkAndSendEmail({request: {...doc, email: email}, PRIVATE_KEY_URL: PRIVATE_KEY_URL});
			if (result !== undefined && result.status === 404) {
				throw new ApiError(HttpStatus.NOT_FOUND);
			}

			return result;
		}
	}

	async function query(doc, user) {
		if (Object.keys(doc).length === 0) {
			throw new ApiError(HttpStatus.BAD_REQUEST);
		} else {
			const {queries, offset} = doc;
			if (hasPermission(user, 'users', 'query')) {
				if (user.role === 'publisher-admin') {
					const queries = [{
						query: {publisher: user.publisher}
					}];
					return userMetadataInterface.query(db, {queries, offset});
				}

				return userMetadataInterface.query(db, {queries, offset});
			}

			throw new ApiError(HttpStatus.FORBIDDEN);
		}
	}

	async function createRequest(doc, user) {
		let isUserExist;
		if (Object.keys(doc).length === 0) {
			throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY);
		} else {
			if (doc.userId && !doc.email) {
				const {crowdUsers} = crowd();
				const allCrowdUsers = await crowdUsers.query();
				isUserExist = allCrowdUsers.includes(doc.userId);

				if (isUserExist) {
					const response = await checkDuplication(usersRequestInterface);
					if (response.results.length > 0 && doc.userId === response.results[0].userId) {
						throw new ApiError(HttpStatus.CONFLICT);
					} else {
						return formatUserAndCreate();
					}
				}

				throw new ApiError(HttpStatus.NOT_FOUND);
			}

			if (doc.email) {
				const {crowdUsers} = crowd();
				const allCrowdUsers = await crowdUsers.query();
				isUserExist = allCrowdUsers.includes(doc.email);
			}

			const response = await checkDuplication(usersRequestInterface);

			if (isUserExist || (response.results.length > 0 && doc.email === response.results[0].id)) {
				throw new ApiError(HttpStatus.CONFLICT);
			} else {
				return formatUserAndCreate();
			}
		}

		async function checkDuplication(interfaceName) {
			const queries = [{
				query: {$or: [{id: doc.email ? doc.email : doc.userId}, {userId: doc.userId ? doc.userId : doc.email}]}
			}];
			const response = await interfaceName.query(db, {queries: queries});
			return response;
		}

		async function formatUserAndCreate() {
			if (hasPermission(user, 'userRequests', 'createRequest')) {
				const newDoc = {
					...doc,
					state: 'new',
					backgroundProcessingState: 'pending',
					preferences: {
						defaultLanguage: 'fin'
					},
					role: 'publisher',
					userId: doc.userId ? doc.userId : doc.email,
					creator: user.id,
					publisher: user.publisher
				};
				validateDoc(newDoc, 'UserRequestContent');
				const result = await usersRequestInterface.create(db, newDoc, user);
				return result;
			}

			throw new ApiError(HttpStatus.FORBIDDEN);
		}
	}

	async function readRequest(id, user) {
		let protectedProperties = user.role === 'publisher-admin' ? {_id: 0, state: 0} : {_id: 0};
		const result = await usersRequestInterface.read(db, id, protectedProperties);
		if (hasPermission(user, 'userRequests', 'readRequest')) {
			if (user.role === 'publisher-admin') {
				if (result.creator === user.id || user.publisher === result.publisher) {
					return result;
				}

				throw new ApiError(HttpStatus.UNAUTHORIZED);
			}

			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function updateRequest(id, doc, user) {
		const newDoc = {...doc, backgroundProcessingState: doc.backgroundProcessingState ? doc.backgroundProcessingState : 'pending'};
		if (newDoc.initialRequest) {
			delete newDoc.initialRequest;
			validateDoc(newDoc, 'UserRequestContent');
		}

		if (hasPermission(user, 'userRequests', 'updateRequest')) {
			const result = await usersRequestInterface.update(db, id, newDoc, user);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function removeRequest(id, user) {
		if (hasPermission(user, 'userRequests', 'removeRequest')) {
			const result = await usersRequestInterface.remove(db, id);
			if (result.value === null) {
				throw new ApiError(HttpStatus.NOT_FOUND);
			} else {
				return result;
			}
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function queryRequest(doc, user) {
		if (Object.keys(doc).length === 0) {
			throw new ApiError(HttpStatus.BAD_REQUEST);
		} else {
			const {queries, offset} = doc;
			const result = await usersRequestInterface.query(db, {queries, offset});
			if (hasPermission(user, 'userRequests', 'queryRequest')) {
				if (user.role === 'publisher-admin') {
					const queries = [{
						query: {publisher: user.publisher}
					}];
					const protectedProperties = {state: 0};
					const response = await usersRequestInterface.query(db, {queries, offset}, protectedProperties);
					return response;
				}

				return result;
			}

			throw new ApiError(HttpStatus.FORBIDDEN);
		}
	}

	function crowd() {
		return {
			crowdUser: {
				read,
				create,
				update,
				remove,
				query
			}

		};

		async function read({id}) {
			const response = await crowdClient.user.get(id);
			return {...response, groups: await getUserGroup(id)};
		}

		async function create({doc}) {
			const payload = new User(doc.givenName, doc.familyName, `${doc.givenName} ${doc.familyName}`, doc.email, doc.email, Math.random().toString(36).slice(2));
			const response = await crowdClient.user.create(payload);
			await crowdClient.user.groups.add(response.email, mapRoleToGroup(doc.role));
			return {...response, groups: await getUserGroup(response.username)};
		}

		async function update({doc}) {
			const userCheckResponse = await crowdClient.user.get(doc.id);
			if (userCheckResponse) {
				const response = await crowdClient.user.password.set(doc.id, doc.newPassword);
				return response;
			}
		}

		async function remove({id}) {
			const group = await getUserGroup(id);
			await crowdClient.user.groups.remove(id, group);
			const response = await crowdClient.user.remove(id);
			return response;
		}

		async function query() {
			const users = await crowdClient.search.user('');
			return users;
		}

		async function getUserGroup(id) {
			// Const nestedGroup = await client.user.groups.list(id, 'nested');
			const directGroup = await crowdClient.user.groups.list(id, 'direct');
			// DirectGroup.concat(nestedGroup)
			// Retruning Only direct Group for this project
			return directGroup;
		}
	}

	async function createLinkAndSendEmail({request, PRIVATE_KEY_URL}) {
		const {JWK, JWE} = jose;
		const key = JWK.asKey(fs.readFileSync(PRIVATE_KEY_URL));
		const response = await crowdClient.user.get(request.id);
		if (response) {
			const payload = jose.JWT.sign(request, key, {
				expiresIn: '24 hours',
				iat: true
			});
			const token = await JWE.encrypt(payload, key, {kid: key.kid});
			const link = `${UI_URL}/users/passwordReset/${token}`;
			const result = sendEmail({
				name: 'forgot password',
				args: {link: link},
				getTemplate: getTemplate,

				SMTP_URL: SMTP_URL,
				API_EMAIL: request.email
			});
			return result;
		}
	}
}
