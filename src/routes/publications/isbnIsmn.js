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
import {bodyParse} from '../../utils';
import {publicationsIsbnIsmnFactory} from '../../interfaces';
import {API_URL} from '../../config';
import HttpStatus from 'http-status';

export default function (db, passportMiddleware) {
	const publications = publicationsIsbnIsmnFactory({url: API_URL});
	return new Router()
		.use(passportMiddleware)
		.post('/', bodyParse(), create)
		.get('/:id', read)
		.put('/:id', bodyParse(), update)
		.post('/query', bodyParse(), query);

	async function create(req, res, next) {
		try {
			const result = await publications.createIsbnIsmn(db, req.body, req.user);
			res.status(HttpStatus.CREATED).json(result);
		} catch (err) {
			next(err);
		}
	}

	async function read(req, res, next) {
		const id = req.params.id;
		try {
			const result = await publications.readIsbnIsmn(db, id, req.user);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function update(req, res, next) {
		const id = req.params.id;
		try {
			const result = await publications.updateIsbnIsmn(db, id, req.body, req.user);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	// Async function remove(req, res, next) {
	// 	const id = req.params.id;
	// 	try {
	// 		const result = await publications.removeIsbnIsmn(db, id, req.user);
	// 		res.json(result);
	// 	} catch (err) {
	// 		next(err);
	// 	}
	// }

	async function query(req, res, next) {
		try {
			const result = await publications.queryIsbnIsmn(db, req.body, req.user);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}
}
