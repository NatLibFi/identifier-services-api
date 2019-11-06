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

import {ApiError, Utils, createApiClient} from '@natlibfi/identifier-services-commons';
import HttpStatus from 'http-status';
import fs from 'fs';
import * as jwtEncrypt from 'jwt-token-encrypt';
import CrowdClient from 'atlassian-crowd-client';
import User from 'atlassian-crowd-client/lib/models/user';

import {
	UI_URL,
	SMTP_URL,
	API_EMAIL,
	API_URL,
	API_USERNAME,
	API_PASSWORD,
	API_CLIENT_USER_AGENT,
	CROWD_URL,
	CROWD_APP_NAME,
	CROWD_APP_PASSWORD
} from '../config';

const {sendEmail} = Utils;

const Ajv = require('ajv');

const client = CROWD_URL ?
	new CrowdClient({
		baseUrl: CROWD_URL,
		application: {
			name: CROWD_APP_NAME,
			password: CROWD_APP_PASSWORD
		}
	}) :
	createApiClient({
		url: API_URL, username: API_USERNAME, password: API_PASSWORD,
		userAgent: API_CLIENT_USER_AGENT
	});

export function hasPermission(profile, user) {
	const permitted = profile.auth.role.some(profileRole => {
		return user.groups.some(
			userRole => userRole === profileRole
		);
	});
	return permitted;
}

export function hasAdminPermission(user) {
	return hasPermission({auth: {role: ['admin']}}, user);
}

export function hasSystemPermission(user) {
	return hasPermission({auth: {role: ['system']}}, user);
}

export function hasPublisherAdminPermission(user) {
	return hasPermission({auth: {role: ['publisher-admin', 'publisherAdmin']}}, user);
}

export function convertLanguage(language) {
	return language === 'fi' ? 'fin' : (language === 'sv' ? 'swe' : 'eng');
}

export function getValidator(schemaName) {
	const str = fs.readFileSync('api.json', 'utf8')
		.replace(/#\/components\/schemas/gm, 'defs#/definitions');

	const obj = JSON.parse(str);

	return new Ajv({allErrors: true})
		.addSchema({
			$id: 'defs',
			definitions: obj.components.schemas
		})
		.compile(obj.components.schemas[schemaName]);
}

export function filterResult(result) {
	delete result.state;
	delete result.publisher;
	delete result.lastUpdated;
	return result;
}

export function local() {
	return {
		localUser: {
			create,
			read,
			update,
			remove
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
			groups: [`${doc.role}`]
		};

		if (containsObject(newData, data)) {
			throw new ApiError(HttpStatus.CONFLICT);
		}

		data.push(newData);
		fs.writeFileSync(formatUrl(PASSPORT_LOCAL_USERS), JSON.stringify(data, null, 4), 'utf-8');
		return null;
		function containsObject(obj, list) {
			return list.some(item => item.id === obj.id);
		}
	}

	function read({PASSPORT_LOCAL_USERS, email}) {
		const res = fs.readFileSync(formatUrl(PASSPORT_LOCAL_USERS), 'utf-8');
		const data = JSON.parse(res);
		const user = (data.filter(item => item.id === email))[0];
		return user;
	}

	function update({PASSPORT_LOCAL_USERS, user}) {
		const {id, newPassword} = user;
		const readResponse = fs.readFileSync(formatUrl(PASSPORT_LOCAL_USERS), 'utf-8');
		const passportLocalList = JSON.parse(readResponse);
		const newPassportLocalList = passportLocalList.map(passport => {
			if (passport.id === id) {
				return {...passport, password: newPassword};
			}

			return passport;
		});

		fs.writeFileSync(formatUrl(PASSPORT_LOCAL_USERS), JSON.stringify(newPassportLocalList, null, 4), 'utf-8');
		return HttpStatus.OK;
	}

	function remove({PASSPORT_LOCAL_USERS, id}) {
		const readResponse = fs.readFileSync(formatUrl(PASSPORT_LOCAL_USERS), 'utf-8');
		const passportLocalList = JSON.parse(readResponse);
		const result = passportLocalList.filter(item => item.id !== id);
		fs.writeFileSync(formatUrl(PASSPORT_LOCAL_USERS), JSON.stringify(result, null, 4), 'utf-8');
		return HttpStatus.OK;
	}
}

export function crowd() {
	return {
		crowdUser: {
			read,
			create,
			update,
			remove
		}

	};

	async function read({id}) {
		const response = await client.user.get(id);
		return response;
	}

	async function create({doc}) {
		const payload = new User(doc.givenName, doc.familyName, `${doc.givenName} ${doc.familyName}`, doc.email, doc.email, Math.random().toString(36).slice(2));
		const response = await client.user.create(payload);
		console.log(payload);
		// Const addToGroupResponse = await client.user.groups.add();
		return response;
	}

	async function update({doc}) {
		const userCheckResponse = await client.user.get(doc.id);
		if (userCheckResponse) {
			const response = await client.user.password.set(doc.id, doc.newPassword);
			return response;
		}
	}

	async function remove({id}) {
		return id;
	}
}

export async function createLinkAndSendEmail({request, PRIVATE_KEY_URL, PASSPORT_LOCAL_USERS}) {
	if (CROWD_URL && CROWD_APP_NAME && CROWD_APP_PASSWORD) {
		const response = await client.user.get(request.id);
		if (response) {
			const token = await encryptToken(PRIVATE_KEY_URL, request);
			const link = `${UI_URL}/users/passwordReset/${token}`;
			const result = sendEmail({
				name: 'change password',
				args: {link: link},
				getTemplate: getTemplate,
				SMTP_URL: SMTP_URL,
				API_EMAIL: API_EMAIL
			});
			return result;
		}
	}

	const readResponse = fs.readFileSync(formatUrl(PASSPORT_LOCAL_USERS), 'utf-8');
	const passportLocalList = JSON.parse(readResponse);
	return passportLocalList.reduce(async (acc, passport) => {
		if (passport.id === request.id) {
			const token = await encryptToken(PRIVATE_KEY_URL, request);
			const link = `${UI_URL}/users/passwordReset/${token}`;
			const result = await sendEmail({
				name: 'change password',
				args: {link: link},
				getTemplate: getTemplate,
				SMTP_URL: SMTP_URL,
				API_EMAIL: API_EMAIL
			});

			acc = result;
			return acc;
		}

		acc = new ApiError(HttpStatus.NOT_FOUND);
		return acc;
	}, {});

	async function encryptToken() {
		const res = fs.readFileSync(`${PRIVATE_KEY_URL}`, 'utf-8');
		const encryption = JSON.parse(res);
		const jwtDetails = {
			secret: 'This',
			expiresIn: '24h'
		};
		const privateData = {
			id: request.id
		};
		const token = await jwtEncrypt.generateJWT(
			jwtDetails,
			undefined,
			encryption[0],
			privateData
		);
		return token;
	}
}

export async function getTemplate(query, cache) {
	const key = JSON.stringify(query);
	if (key in cache) {
		return cache[key];
	}

	cache[key] = await client.templates.getTemplate(query);
	return cache[key];
}

function formatUrl(url) {
	return url.replace(/^file:\/\//, '');
}
