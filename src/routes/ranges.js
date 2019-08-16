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
import {rangesFactory} from '../interfaces';
import {API_URL} from '../config';
import {bodyParse} from '../utils';

export default function (db, passportMiddlewares) {
	const ranges = rangesFactory({url: API_URL});

	return new Router()
		.use(passportMiddlewares.token)
		.post('/isbn', bodyParse(), createIsbn)
		.get('/isbn/:id', readIsbn)
		.put('/isbn/:id', bodyParse(), updateIsbn)
		.post('/isbn/query', bodyParse(), queryIsbn)

		.post('/ismn', bodyParse(), createIsmn)
		.get('/ismn/:id', readIsmn)
		.put('/ismn/:id', bodyParse(), updateIsmn)
		.post('/ismn/query', bodyParse(), queryIsmn)

		.post('/issn', bodyParse(), createIssn)
		.get('/issn/:id', readIssn)
		.put('/issn/:id', bodyParse(), updateIssn)
		.post('/issn/query', bodyParse(), queryIssn);

	// ISBN routes

	async function createIsbn(req, res, next) {
		try {
			const result = await ranges.createIsbn(db, req.body, req.user);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function readIsbn(req, res, next) {
		const id = req.params.id;
		try {
			const result = await ranges.readIsbn(db, id, req.user);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function updateIsbn(req, res, next) {
		const id = req.params.id;
		try {
			const result = await ranges.updateIsbn(db, id, req.body, req.user);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function queryIsbn(req, res, next) {
		try {
			const result = await ranges.queryIsbn(db, req.body, req.user);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	// ISMN routes

	async function createIsmn(req, res, next) {
		try {
			const result = await ranges.createIsmn(db, req.body, req.user);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function readIsmn(req, res, next) {
		const id = req.params.id;
		try {
			const result = await ranges.readIsmn(db, id, req.user);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function updateIsmn(req, res, next) {
		const id = req.params.id;
		try {
			const result = await ranges.updateIsmn(db, id, req.body, req.user);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function queryIsmn(req, res, next) {
		try {
			const result = await ranges.queryIsmn(db, req.body, req.user);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	// ISSN routes

	async function createIssn(req, res, next) {
		try {
			const result = await ranges.createIssn(db, req.body, req.user);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function readIssn(req, res, next) {
		const id = req.params.id;
		try {
			const result = await ranges.readIssn(db, id, req.user);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function updateIssn(req, res, next) {
		const id = req.params.id;
		try {
			const result = await ranges.updateIssn(db, id, req.body, req.user);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	async function queryIssn(req, res, next) {
		try {
			const result = await ranges.queryIssn(db, req.body, req.user);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}
}
