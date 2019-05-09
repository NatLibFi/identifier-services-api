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

export default function() {
	const ranges = rangesFactory({url: API_URL});

	return new Router()
		.post('/isbn', createIsbn)
		.get('/isbn/:id', readIsbn)
		.put('/isbn/:id', updateIsbn)
		.post('/isbn/query', queryIsbn)

		.post('/ismn', createIsmn)
		.get('/ismn/:id', readIsmn)
		.put('/ismn/:id', updateIsmn)
		.post('/ismn/query', queryIsmn)

		.post('/issn', createIssn)
		.get('/issn/:id', readIssn)
		.put('/issn/:id', updateIssn)
		.post('/issn/query', queryIssn);

	// ISBN routes

	async function createIsbn(req, res, next) {
		try {
			const result = await ranges.createIsbn(req.body);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}
	async function readIsbn(req, res, next) {
		const id = req.params.id;
		try {
			const result = await ranges.readIsbn(id);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}
	async function updateIsbn(req, res, next) {
		const id = req.params.id;
		try {
			const result = await ranges.updateIsbn(id, req.body);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}
	async function queryIsbn(req, res, next) {
		try {
			const result = await ranges.queryIsbn();
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	// ISMN routes

	async function createIsmn(req, res, next) {
		try {
			const result = await ranges.createIsmn(req.body);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}
	async function readIsmn(req, res, next) {
		const id = req.params.id;
		try {
			const result = await ranges.readIsmn(id);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}
	async function updateIsmn(req, res, next) {
		const id = req.params.id;
		try {
			const result = await ranges.updateIsmn(id, req.body);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}
	async function queryIsmn(req, res, next) {
		try {
			const result = await ranges.queryIsmn();
			res.json(result);
		} catch (err) {
			next(err);
		}
	}

	// ISSN routes

	async function createIssn(req, res, next) {
		try {
			const result = await ranges.createIssn(req.body);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}
	async function readIssn(req, res, next) {
		const id = req.params.id;
		try {
			const result = await ranges.readIssn(id);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}
	async function updateIssn(req, res, next) {
		const id = req.params.id;
		try {
			const result = await ranges.updateIssn(id, req.body);
			res.json(result);
		} catch (err) {
			next(err);
		}
	}
	async function queryIssn(req, res, next) {
		try {
			const result = await ranges.queryIssn();
			res.json(result);
		} catch (err) {
			next(err);
		}
	}
}
