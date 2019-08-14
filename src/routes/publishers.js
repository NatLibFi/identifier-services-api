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

export default function (db, passportMiddlewares) {
	const publishers = publishersFactory({url: API_URL});
	return new Router()
		.get('/:id', authenticated, read)
		.post('/query', query)
		.use(passportMiddlewares.token)
		.post('/', create)
		.put('/:id', update);

	function authenticated(req, res, next) {
		if ('authorization' in req.headers) {
			return passportMiddlewares.token(req, res, next);
		}

		next();
	}

	async function create(req, res, next) {
		try {
			const result = await publishers.create(db, req.body, req.user);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function read(req, res, next) {
		const id = req.params.id;
		try {
			const result = await publishers.read(db, id, req.user);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function update(req, res, next) {
		const id = req.params.id;
		try {
			const result = await publishers.update(db, id, req.body, req.user);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function query(req, res, next) {
		try {
			const result = await publishers.query(db, req.body);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}
}
