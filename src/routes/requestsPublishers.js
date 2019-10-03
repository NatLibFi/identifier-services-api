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

import {Router} from 'express';
import {publisherRequestsFactory} from '../interfaces';
import {API_URL} from '../config';
import HttpStatus from 'http-status';

export default function (db, passportMiddlewares) {
	const publisherRequests = publisherRequestsFactory({url: API_URL});
	return new Router()
		.use(passportMiddlewares.token)
		.post('/', createRequest)
		.get('/:id', readRequest)
		.put('/:id', updateRequest)
		.delete('/:id', removeRequest)
		.post('/query', queryRequests);

	async function createRequest(req, res, next) {
		try {
			const result = await publisherRequests.createRequest(db, req.body, req.user);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function readRequest(req, res, next) {
		try {
			const result = await publisherRequests.readRequest(db, req.params.id, req.user);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function removeRequest(req, res, next) {
		try {
			const result = await publisherRequests.removeRequest(db, req.params.id, req.user);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function updateRequest(req, res, next) {
		const id = req.params.id;
		const body = req.body;
		try {
			const result = publisherRequests.updateRequest(db, id, body, req.user);
			res.json(result).status(HttpStatus.OK);
		} catch (err) {
			next(err);
		}
	}

	async function queryRequests(req, res, next) {
		try {
			const result = await publisherRequests.queryRequests(db, req.body, req.user);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}
}
