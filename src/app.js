/* eslint-disable no-inner-declarations */
/* eslint-disable no-console */
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
import {Utils} from '@natlibfi/melinda-commons';
import express from 'express';
import cors from 'cors';
import {
	createUsersRouter,
	createPublishersRouter,
	createPublicationsRouterIsbnIsmn,
	createPublicationsRouterIssn,
	createMessageTemplate,
	createRangesRouter
} from './routes';
import {ENABLE_PROXY, MONGO_URI, HTTP_PORT} from './config';
import {MongoClient} from 'mongodb';

const {handleInterrupt} = Utils;

export default async function run() {
	try {
		// Const Logger = createLogger();
		const app = express();
		app.enable('trust proxy', ENABLE_PROXY);

		app.use(cors());
		console.log('----------', MONGO_URI);
		const client = new MongoClient(MONGO_URI, {useNewUrlParser: true});
		const connection = await client.connect();
		const dbName = 'IdentifierServices';
		const db = connection.db(dbName);
		console.log(await db.collections());
		app.use('/templates', createMessageTemplate(db));
		app.use('/users', createUsersRouter(db));
		app.use('/publishers', createPublishersRouter(db));
		app.use('/publications/isbn-ismn', createPublicationsRouterIsbnIsmn(db));
		app.use('/publications/issn', createPublicationsRouterIssn(db));
		app.use('/ranges', createRangesRouter(db));

		// Let db;
		// client.connect(async err => {
		// 	const dbName = 'IdentifierServices';
		// 	db = client.db(dbName);
		// 	console.log(err);
		// 	console.log(await db.collections());
		// 	app.use('/templates', createMessageTemplate(db));
		// 	app.use('/users', createUsersRouter(db));
		// 	app.use('/publishers', createPublishersRouter(db));
		// 	app.use('/publications/isbn-ismn', createPublicationsRouterIsbnIsmn(db));
		// 	app.use('/publications/issn', createPublicationsRouterIssn(db));
		// 	app.use('/ranges', createRangesRouter(db));
		// });

		const server = app.listen(HTTP_PORT, () => {
			// Logger.log('info', 'Started melinda-record-import-api');
			console.log(`server running in port ${HTTP_PORT}`);
		});

		registerSignalHandlers();

		return server;

		function registerSignalHandlers() {
			process
				.on('SIGINT', handle)
				.on('uncaughtException', handle)
				.on('unhandledRejection', handle)
				// Nodemon
				.on('SIGUSR2', handle);

			function handle(arg) {
				server.close();
				handleInterrupt(arg);
			}
		}
	} catch (err) {
		console.log(err);
	}
}
