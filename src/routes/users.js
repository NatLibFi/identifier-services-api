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

import {usersFactory} from '../interfaces';
import {API_URL} from '../config';

export default function (db) {
	const users = usersFactory({url: API_URL});

	return new Router()
		.post('/', create)
		.get('/:id', read)
		.put('/:id', update)
		.delete('/:id', remove)
		.post('/:id/password', changePwd)
		.post('/query', query)
		.post('/requests', createRequest)
		.get('/requests/:id', readRequest)
		.delete('/requests/:id', removeRequest)
		.put('/requests/:id', updateRequest)
		.post('/requests/query', queryRequest);

	async function create(req, res, next) {
		try {
			const result = await users.create(db, req.body);
			res.json(result);
		} catch (err) {
			return next(err);
		}
	}

	async function read(req, res, next) {
		const id = req.params.id;
		try {
			const result = await users.read(db, id);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function update(req, res, next) {
		const id = req.params.id;
		try {
			const result = await users.update(db, id, req.body);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function remove(req, res, next) {
		const id = req.params.id;
		try {
			const result = await users.remove(db, id);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function changePwd(req, res, next) {
		try {
			res.json(req.body);
		} catch (err) {
			next(err);
		}
	}

	async function query(req, res, next) {
		try {
			const result = await users.query(db);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function createRequest(req, res, next) {
		try {
			const result = await users.createRequest(db, req.body);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function readRequest(req, res, next) {
		const id = req.params.id;
		try {
			const result = await users.readRequest(db, id);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function updateRequest(req, res, next) {
		const id = req.params.id;
		try {
			const result = await users.updateRequest(db, id, req.body);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function removeRequest(req, res, next) {
		const id = req.params.id;
		try {
			const result = await users.removeRequest(db, id);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function queryRequest(req, res, next) {
		try {
			const result = await users.queryRequest(db);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}
}
