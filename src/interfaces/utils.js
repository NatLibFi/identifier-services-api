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

const {readFileSync} = require('fs');
const Ajv = require('ajv');

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
	return hasPermission({auth: {role: ['publisherAdmin']}}, user);
}

export function convertLanguage(language) {
	return language === 'fi' ? 'fin' : (language === 'sv' ? 'swe' : 'eng');
}

export function getValidator(schemaName) {
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

export function filterResult(result) {
	delete result.state;
	delete result.publisher;
	delete result.lastUpdated;
	return result;
}
