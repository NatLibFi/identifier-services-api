
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

const publicationsRequestsIsbnIsmnInterface = interfaceFactory('PublicationRequest_ISBN_ISMN', 'PublicationIsbnIsmnRequestContent');

export default function () {
	return {
		createRequestIsbnIsmn,
		readRequestIsbnIsmn,
		updateRequestIsbnIsmn,
		removeRequestIsbnIsmn
	};

	async function createRequestIsbnIsmn(db, doc, user) {
		const result = await publicationsRequestsIsbnIsmnInterface.create(db, doc, user);
		return result;
	}

	async function readRequestIsbnIsmn(db, id) {
		const result = await publicationsRequestsIsbnIsmnInterface.read(db, id);
		return result;
	}

	async function updateRequestIsbnIsmn(db, id, doc, user) {
		const result = await publicationsRequestsIsbnIsmnInterface.update(db, id, doc, user);
		return result;
	}

	async function removeRequestIsbnIsmn(db, id) {
		const result = await publicationsRequestsIsbnIsmnInterface.remove(db, id);
		return result;
	}
}
