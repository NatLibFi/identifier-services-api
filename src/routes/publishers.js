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
import bodyParser from 'body-parser';
import validateContentType from '@natlibfi/express-validate-content-type';

import {usersFactory} from '../interfaces';
import {API_URL} from '../config';

export default function() {
	const users = usersFactory({url: API_URL});

	// const mongo = {
	// 	Users: db.db,
	// 	Publishers: db.collections
	// };

	return new Router()
		.post(
			'/',
			validateContentType({
				type: ['application/json', 'application/x-www-form-urlencoded']
			}),
			bodyParser.urlencoded({extended: false}),
			bodyParser.json({
				type: ['application/json', 'application/x-www-form-urlencoded']
			}),
			create
		)
		.get('/:id', read)
		.put('/:id', update)
		.delete('/:id', remove)
		.post('/query', query);

	async function create(req, res, next) {
		try {
			const user = await users.create({
				preference: req.body.preference
			});
			res.json(user);
		} catch (err) {
			next(err);
		}
	}

	async function read(req, res, next) {
		try {
			res.json(req);
		} catch (err) {
			next(err);
		}
	}

	async function update(req, res, next) {
		try {
			res.json(req.body);
		} catch (err) {
			next(err);
		}
	}

	async function remove(req, res, next) {
		try {
			res.json(req.body);
		} catch (err) {
			next(err);
		}
	}

	async function query(req, res, next) {
		try {
			res.json(req);
		} catch (err) {
			next(err);
		}
	}
}
