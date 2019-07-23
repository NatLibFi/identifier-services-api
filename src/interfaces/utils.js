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

export async function pagination(db, collectionName, query, args) {
	let searchObj = {};
	if (args) {
		searchObj = args;
	}

	if (query.count) {
		// eslint-disable-next-line radix
		query.count = parseInt(query.count);
	} else {
		query.count = 5;
	}

	if (query.page) {
		// eslint-disable-next-line radix
		query.skip = parseInt((query.page - 1) * query.count);
	} else {
		query.skip = 0;
	}

	const result = await db.collection(collectionName)
		.find(searchObj)
		.limit(query.count)
		.skip(query.skip)
		.toArray();
	return result;
}

export async function countFn(db, collectionName, query, args) {
	let searchObj = {};
	if (args) {
		searchObj = args;
	}

	const result = await db.collection(collectionName)
		.find(searchObj)
		.toArray();
	return result;
}
