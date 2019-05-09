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
import {publishersFactory} from '../interfaces';
import {API_URL} from '../config';

export default function () {
	const publishers = publishersFactory({url: API_URL});

	return new Router()
		.post('/', create)
		.get('/:id', read)
		.put('/:id', update)
		.delete('/:id', remove)
		.post('/query', query)
		.post('/requests', createRequests)
		.get('/requests/:id', readRequest)
		.delete('/requests/:id', removeRequest)
		.put('/requests/:id', updateRequest)
		.post('/requests/query', queryRequests);

	async function create(req, res, next) {
		try {
			const result = await publishers.create(req.body);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function read(req, res, next) {
		const id = req.params.id;
		try {
			const result = await publishers.read(id);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function update(req, res, next) {
		const id = req.params.id;
		try {
			const result = await publishers.update(id, req.body);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function remove(req, res, next) {
		const id = req.params.id;
		try {
			const result = await publishers.remove(id);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function query(req, res, next) {
		try {
			const result = await publishers.query();
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function createRequests(req, res, next) {
		try {
			const result = await publishers.createRequests(req.body);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function readRequest(req, res, next) {
		try {
			const result = await publishers.readRequest(req.params.id);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function removeRequest(req, res, next) {
		try {
			const result = await publishers.removeRequest(req.params.id);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function updateRequest(req, res, next) {
		const id = req.params.id;
		try {
			const result = await publishers.updateRequest(id, req.body);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function queryRequests(req, res, next) {
		try {
			const result = await publishers.queryRequests();
			res.json(result);
		} catch (err) {
			next(err);
		}
	}
}
