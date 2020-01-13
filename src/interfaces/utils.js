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
import jose from 'jose';
import CrowdClient from 'atlassian-crowd-client';
const Ajv = require('ajv');
const {readFileSync} = require('fs');
const path = require('path');

import {formatUrl} from '../utils';
import {
	UI_URL,
	SMTP_URL,
	API_URL,
	API_USERNAME,
	API_PASSWORD,
	API_CLIENT_USER_AGENT,
	CROWD_URL,
	CROWD_APP_NAME,
	CROWD_APP_PASSWORD
} from '../config';

const {sendEmail} = Utils;

const crowdClient = new CrowdClient({
	baseUrl: CROWD_URL,
	application: {
		name: CROWD_APP_NAME,
		password: CROWD_APP_PASSWORD
	}
});

const localClient =	createApiClient({
	url: API_URL, username: API_USERNAME, password: API_PASSWORD,
	userAgent: API_CLIENT_USER_AGENT
});

const permissions = {
	users: {
		create: ['system', 'admin'],
		read: ['system', 'admin', 'publisher-admin'],
		update: ['system'],
		remove: ['system', 'admin'],
		changePwd: ['system', 'admin'],
		query: ['system', 'admin', 'publisher-admin']
	},
	userRequests: {
		createRequest: ['publisher-admin'],
		readRequest: ['system', 'admin', 'publisher-admin'],
		updateRequest: ['system', 'admin'],
		removeRequest: ['system'],
		queryRequest: ['system', 'admin', 'publisher-admin']
	},
	publishers: {
		create: ['admin', 'system'],
		read: ['all'],
		update: ['publisher-admin'],
		query: ['all']
	},
	publisherRequests: {
		createRequest: ['all'],
		readRequest: ['system', 'admin'],
		updateRequest: ['system', 'admin'],
		removeRequest: ['system'],
		queryRequests: ['system', 'admin']
	},
	publicationIsbnIsmn: {
		createIsbnIsmn: ['admin', 'system'],
		readIsbnIsmn: ['admin', 'publisher-admin'],
		updateIsbnIsmn: ['system', 'admin'],
		queryIsbnIsmn: ['system', 'admin', 'publisher-admin', 'publisher']
	},
	publicationIsbnIsmnRequests: {
		createRequestIsbnIsmn: ['system', 'publisher-admin', 'publisher'],
		readRequestIsbnIsmn: ['system', 'admin', 'publisher-admin', 'publisher'],
		updateRequestIsbnIsmn: ['system', 'admin'],
		removeRequestIsbnIsmn: ['system'],
		queryRequestIsbnIsmn: ['system', 'admin', 'publisher-admin', 'publisher']
	},
	publicationIssn: {
		createISSN: ['admin', 'system'],
		readISSN: ['admin', 'publisher-admin'],
		updateISSN: ['system', 'admin'],
		queryISSN: ['system', 'admin', 'publisher-admin', 'publisher']
	},
	publicationIssnRequests: {
		createRequestISSN: ['system', 'publisher-admin', 'publisher'],
		readRequestISSN: ['system', 'admin', 'publisher-admin', 'publisher'],
		updateRequestISSN: ['system', 'admin'],
		removeRequestISSN: ['system'],
		queryRequestISSN: ['system', 'admin', 'publisher-admin', 'publisher']
	},
	messageTemplates: {
		create: ['admin'],
		read: ['admin', 'system'],
		update: ['system', 'admin'],
		remove: ['admin'],
		query: ['system', 'admin']
	},
	ranges: {
		createIsbn: ['admin', 'system'],
		readIsbn: ['admin', 'system'],
		updateIsbn: ['admin', 'system'],
		queryIsbn: ['admin', 'system'],
		createIsmn: ['admin', 'system'],
		readIsmn: ['admin', 'system'],
		updateIsmn: ['admin', 'system'],
		queryIsmn: ['admin', 'system'],
		createIssn: ['admin', 'system'],
		readIssn: ['admin', 'system'],
		updateIssn: ['admin', 'system'],
		queryIssn: ['admin', 'system']
	}
};

export function hasPermission(user, type, command) {
	const commandPermissions = permissions[type][command];
	const permitted = commandPermissions.includes('all') || commandPermissions.some(role => {
		return user.role === role;
	});
	return permitted;
}

export function convertLanguage(language) {
	return language === 'fi' ? 'fin' : (language === 'sv' ? 'swe' : 'eng');
}

export function filterResult(result) {
	delete result.state;
	delete result.publisher;
	delete result.lastUpdated;
	return result;
}

export async function createLinkAndSendEmail({request, PRIVATE_KEY_URL, PASSPORT_LOCAL_USERS}) {
	const {JWK, JWE} = jose;
	const key = JWK.asKey(fs.readFileSync(PRIVATE_KEY_URL));
	if (CROWD_URL && CROWD_APP_NAME && CROWD_APP_PASSWORD) {
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

	const readResponse = fs.readFileSync(formatUrl(PASSPORT_LOCAL_USERS), 'utf-8');
	const passportLocalList = JSON.parse(readResponse);
	const passportArray = passportLocalList.map(item => item.id);
	return passportLocalList.reduce(async (acc, passport) => {
		if (passportArray.includes(request.id)) {
			if (passport.id === request.id) {
				const payload = jose.JWT.sign(request, key, {
					expiresIn: '24 hours',
					iat: true
				});
				const token = JWE.encrypt(payload, key, {kid: key.kid});
				const link = `${UI_URL}/users/passwordReset/${token}`;
				const result = await sendEmail({
					name: 'forgot password',
					args: {link: link},
					getTemplate: getTemplate,
					SMTP_URL: SMTP_URL,
					API_EMAIL: request.email
				});
				acc = result;
			}
		} else {
			acc = new ApiError(HttpStatus.NOT_FOUND);
		}

		return acc;
	}, {});
}

export async function getTemplate(query, cache) {
	const key = JSON.stringify(query);
	if (key in cache) {
		return cache[key];
	}

	cache[key] = await localClient.templates.getTemplate(query);
	return cache[key];
}

export function validateDoc(doc, collectionContent) {
	const validate = getValidator(collectionContent);
	if (validate(doc)) {
		return validate;
	}

	throw new Error(JSON.stringify(validate.errors, undefined, 2));
}

function getValidator(schemaName) {
	const str = readFileSync(path.join(__dirname, '..', 'api.json'), 'utf8')
		.replace(/#\/components\/schemas/gm, 'defs#/definitions');
	const obj = JSON.parse(str);

	return new Ajv({allErrors: true})
		.addSchema({
			$id: 'defs',
			definitions: obj.components.schemas
		})
		.compile(obj.components.schemas[schemaName]);
}
