
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

import validateContentType from '@natlibfi/express-validate-content-type';
import bodyParser from 'body-parser';
import fs from 'fs';
import {GROUPS_AND_ROLES} from './config';

const readResponse = fs.readFileSync(formatUrl(GROUPS_AND_ROLES), 'utf-8');

export function bodyParse() {
	validateContentType({
		type: ['application/json']
	});
	return bodyParser.json({
		type: ['application/json']
	});
}

export function mapRoleToGroup(role) {
	const data = JSON.parse(readResponse);
	return Object.keys(data).reduce((acc, key) => {
		if (role === key) {
			acc = data[key];
		}

		return acc;
	}, '');
}

export function mapGroupToRole(group) {
	const data = JSON.parse(readResponse);
	return Object.values(data).reduce((acc, value) => {
		if (group.includes(value)) {
			acc = Object.keys(data).reduce((accumulate, key) => {
				if (data[key] === value) {
					accumulate = key;
				}

				return accumulate;
			});
		}

		return acc;
	}, '');
}

export function checkRoleInGroup(group) {
	const data = JSON.parse(readResponse);
	return Object.values(data).some(value => group.includes(value)
	);
}

export function formatUrl(url) {
	return url.replace(/^file:\/\//, '');
}
