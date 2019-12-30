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
import {ApiError} from '@natlibfi/identifier-services-commons';
import fs from 'fs';

import {hasPermission, createLinkAndSendEmail, validateDoc} from '../../src/interfaces/utils';
import interfaceFactory from '../../src/interfaces/interfaceModules';
import {formatUrl, mapGroupToRole, checkRoleInGroup, mapRoleToGroup} from '../../src/utils';

const userInterface = interfaceFactory('userMetadata');

export default function ({PASSPORT_LOCAL_USERS, PRIVATE_KEY_URL, db}) {
	return {
		create,
		read,
		update,
		remove,
		changePwd,
		query
	};

	async function create(doc, user) {
		let isUserExit;
		if (Object.keys(doc).length === 0) {
			throw new ApiError(HttpStatus.BAD_REQUEST);
		} else {
			if (doc.email) {
				doc.id = doc.email;
				validateDoc(doc, 'UserContent');
				if (hasPermission(user, 'users', 'create')) {
					try {
						const {localUser} = local();
						await localUser.create({PASSPORT_LOCAL_USERS: PASSPORT_LOCAL_USERS, doc: doc});
					} catch (err) {
						throw new ApiError(err.status);
					}

					const {role, givenName, userId, familyName, email, ...rest} = {...doc};
					const result = await userInterface.create(db, rest, user);
					return result;
				}

				throw new ApiError(HttpStatus.FORBIDDEN);
			}

			if (doc.userId && !doc.email) {
				const {localUser} = local();
				const allLocalUsers = await localUser.query({PASSPORT_LOCAL_USERS: PASSPORT_LOCAL_USERS});

				if (allLocalUsers.some(item => item.id === doc.userId)) {
					allLocalUsers.map(item => {
						if (!checkRoleInGroup(item.groups)) {
							item.groups.push(mapRoleToGroup(doc.role));
						}

						return item;
					});

					isUserExit = true;
				}
			}

			if (isUserExit) {
				doc.id = doc.userId;
				const {role, givenName, familyName, userId, email, ...rest} = {...doc};
				const queries = [{
					query: {id: doc.id}
				}];
				const response = await userInterface.query(db, {queries});
				if (response.results.length > 0 && response.results[0].id === doc.id) {
					throw new ApiError(HttpStatus.CONFLICT);
				} else {
					const result = await userInterface.create(db, rest, user);
					return result;
				}
			}

			if (!doc.userId && !doc.email) {
				throw new ApiError(HttpStatus.BAD_REQUEST);
			}

			throw new ApiError(HttpStatus.NOT_FOUND);
		}
	}

	async function read(id, user) {
		const response = await userInterface.read(db, id);
		let result;
		const {localUser} = local();
		result = await localUser.read({PASSPORT_LOCAL_USERS: PASSPORT_LOCAL_USERS, value: response.userId ? response.userId : response.id}); // Delete id later
		result = {...result, role: mapGroupToRole(result.groups)};

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
		if (hasPermission(user, 'users', 'update')) {
			try {
				const {localUser} = local();
				await localUser.update({PASSPORT_LOCAL_USERS: PASSPORT_LOCAL_USERS, doc: doc});
			} catch (err) {
				throw new ApiError(err.status);
			}

			const {role, givenName, userId, familyName, email, ...rest} = {...doc};
			const result = await userInterface.update(db, id, rest, user);
			return result;
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function remove(id, user) {
		if (hasPermission(user, 'users', 'remove')) {
			const response = await userInterface.read(db, id);
			if (response === null) {
				throw new ApiError(HttpStatus.NOT_FOUND);
			} else {
				const {localUser} = local();
				await localUser.remove({PASSPORT_LOCAL_USERS: PASSPORT_LOCAL_USERS, id: response.userId ? response.userId : response.id});
				const result = await userInterface.remove(db, id);
				return result;
			}
		}

		throw new ApiError(HttpStatus.FORBIDDEN);
	}

	async function changePwd(doc, user) {

		if (doc.newPassword) {
			if (hasPermission(user, 'users', 'changePwd')) {
				const {localUser} = local();
				// Changes made for unit test original should  not return anything
				return localUser.update({PASSPORT_LOCAL_USERS: PASSPORT_LOCAL_USERS, doc: doc});
			}

			throw new ApiError(HttpStatus.FORBIDDEN);
		} else {
			const {localUser} = local();
			const response = await localUser.read({PASSPORT_LOCAL_USERS: PASSPORT_LOCAL_USERS, value: doc.id});
			const email = response.emails[0].value;
			const result = await createLinkAndSendEmail({request: {...doc, email: email}, PRIVATE_KEY_URL: PRIVATE_KEY_URL, PASSPORT_LOCAL_USERS: PASSPORT_LOCAL_USERS});
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
					return userInterface.query(db, {queries, offset});
				}

				return userInterface.query(db, {queries, offset});
			}

			throw new ApiError(HttpStatus.UNAUTHORIZED);
		}
	}

	function local() {
		return {
			localUser: {
				create,
				read,
				update,
				remove,
				query
			}
		};
		function create({PASSPORT_LOCAL_USERS, doc}) {
			const res = fs.readFileSync(formatUrl(PASSPORT_LOCAL_USERS), 'utf-8');
			const data = JSON.parse(res);
			const newData = {
				id: doc.email,
				password: Math.random().toString(36).slice(2),
				name: {
					givenName: doc.givenName,
					familyName: doc.familyName
				},
				displayName: `${doc.givenName}${doc.familyName}`,
				emails: [{value: doc.email, type: 'work'}],
				organization: [],
				groups: [mapRoleToGroup(doc.role)]
			};
			if (containsObject(newData, data)) {
				throw new ApiError(HttpStatus.CONFLICT);
			}

			data.push(newData);
			return data;

			function containsObject(obj, list) {
				return list.some(item => item.id === obj.id);
			}
		}

		function read({PASSPORT_LOCAL_USERS, value}) {
			const res = fs.readFileSync(formatUrl(PASSPORT_LOCAL_USERS), 'utf-8');
			const data = JSON.parse(res);
			const user = (data.filter(item => item.id === value))[0];
			return user;
		}

		function update({PASSPORT_LOCAL_USERS, doc}) {
			const {id, newPassword} = doc;
			const readResponse = fs.readFileSync(formatUrl(PASSPORT_LOCAL_USERS), 'utf-8');
			const passportLocalList = JSON.parse(readResponse);
			const newPassportLocalList = passportLocalList.map(passport => {
				if (newPassword && passport.id === id) {
					return {...passport, password: newPassword};
				}

				passport = doc;
				return passport;
			});

			return newPassportLocalList; // Changes made for unit test original should  write file and only return HttpStatus.OK
		}

		function remove({PASSPORT_LOCAL_USERS, id}) {
			const readResponse = fs.readFileSync(formatUrl(PASSPORT_LOCAL_USERS), 'utf-8');
			const passportLocalList = JSON.parse(readResponse);
			const result = passportLocalList.filter(item => item.id !== id);

			return {result, status: HttpStatus.OK}; // Changes made for unit test original should  write file and only return HttpStatus.OK
		}

		function query({PASSPORT_LOCAL_USERS}) {
			const readResponse = fs.readFileSync(formatUrl(PASSPORT_LOCAL_USERS), 'utf-8');
			const passportLocalList = JSON.parse(readResponse);
			const result = passportLocalList.map(item => item);
			return result;
		}
	}
}
