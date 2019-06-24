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
import {default as bodyParse} from './utils';
import svgCaptcha from 'svg-captcha';
import uuidv4 from 'uuid/v4';

export default function () {
	let captcha;

	return new Router()
		.get('/', create)
		.post('/', bodyParse(), post);

	async function create(req, res, next) {
		try {
			captcha = svgCaptcha.create({
				size: 6,
				noise: 4
			});
			captcha.id = uuidv4();
			const {text, ...captchaWithoutText} = captcha;
			res.type('svg');
			res.json(captchaWithoutText);
		} catch (err) {
			next(err);
		}
	}

	async function post(req, res, next) {
		console.log('id', captcha.id);
		console.log('req', req.body.id);
		let result = false;
		try {
			if ((captcha.text === req.body.captchaInput) && captcha.id === req.body.id) {
				result = true;
			} else {
				result = false;
			}
		} catch (err) {
			next(err);
		}

		res.send(result);
	}
}
