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

import interfaceFactory from './interfaceModules';

const publicationsIssnInterface = interfaceFactory('Publication_ISSN', 'PublicationIssnContent');

export default function () {
	return {
		createISSN,
		readISSN,
		updateISSN,
		removeISSN,
		queryISSN
	};

	async function createISSN(db, doc, user) {
		const result = await publicationsIssnInterface.create(db, doc, user);
		return result;
	}

	async function readISSN(db, id) {
		const result = await publicationsIssnInterface.read(db, id);
		return result;
	}

	async function updateISSN(db, id, doc, user) {
		const result = await publicationsIssnInterface.update(db, id, doc, user);
		return result;
	}

	async function removeISSN(db, id) {
		const result = await publicationsIssnInterface.remove(db, id);
		return result;
	}

	async function queryISSN(db, {query, offset}) {
		const result = await publicationsIssnInterface.query(db, {query, offset});
		return result;
	}
}
