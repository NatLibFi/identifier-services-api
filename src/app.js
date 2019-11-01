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
 * identifier-services-api is distributed in the hauthenticationRouter(passportMiddlewares.credentials));pe that it will be useful,
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
import {Utils, Authentication} from '@natlibfi/melinda-commons';
import express from 'express';
import cors from 'cors';
import {MongoClient} from 'mongodb';
import {
	createUsersRouter,
	createRequestsUsersRouter,
	createPublishersRouter,
	createPublishersRequestsRouter,
	createPublicationsRouterIsbnIsmn,
	createRequestsPublicationsRouterIsbnIsmn,
	createPublicationsRouterIssn,
	createRequestsPublicationsRouterIssn,
	createMessageTemplate,
	createRangesRouter,
	authenticationRouter
} from './routes';
import {bodyParse} from './utils';
import {
	whiteList,
	ENABLE_PROXY,
	MONGO_URI, HTTP_PORT,
	USER_AGENT_LOGGING_BLACKLIST,
	CROWD_URL,
	CROWD_APP_NAME,
	CROWD_APP_PASSWORD,
	PASSPORT_LOCAL_USERS
} from './config';

const {createLogger, createExpressLogger, handleInterrupt} = Utils;
const {Crowd: {generatePassportMiddlewares}} = Authentication;

export default async function run() {
	const Logger = createLogger();
	const app = express();
	const client = new MongoClient(MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});
	const connection = await client.connect();
	const db = connection.db();

	const passportMiddlewares = await generatePassportMiddlewares({
		crowd: {
			appName: CROWD_APP_NAME, appPassword: CROWD_APP_PASSWORD,
			url: CROWD_URL ? `${CROWD_URL}/rest` : null, useCache: true, fetchGroupMembership: true
		},
		localUsers: PASSPORT_LOCAL_USERS
	});

	const corsOptions = {
		origin: (origin, callback) => {
			if (origin === undefined) {
				callback(null, true);
			} else {
				const originIsWhitelisted = whiteList.indexOf(origin) !== -1;
				if (!originIsWhitelisted) {
					Logger.log('info', `Request from origin ${origin} is not whitelisted.`);
				}

				callback(originIsWhitelisted ? null : 'Bad Request', originIsWhitelisted);
			}
		},
		credentials: true
	};

	app.enable('trust proxy', ENABLE_PROXY);
	app.use(createExpressLogger({
		skip: r => USER_AGENT_LOGGING_BLACKLIST.includes(r.get('User-Agent'))
	}));
	app.use(cors(corsOptions));
	app.use(bodyParse());

	app.use('/templates', passportMiddlewares.token, createMessageTemplate(db, combineUserInfo));
	app.use('/users', passportMiddlewares.token, createUsersRouter(db, combineUserInfo));
	app.use('/requests/users', passportMiddlewares.token, createRequestsUsersRouter(db, combineUserInfo));
	app.use('/publishers', createPublishersRouter(db, passportMiddlewares, combineUserInfo));
	app.use('/requests/publishers', passportMiddlewares.token, createPublishersRequestsRouter(db, combineUserInfo));
	app.use('/publications/isbn-ismn', passportMiddlewares.token, createPublicationsRouterIsbnIsmn(db, combineUserInfo));
	app.use('/requests/publications/isbn-ismn', passportMiddlewares.token, createRequestsPublicationsRouterIsbnIsmn(db, combineUserInfo));
	app.use('/publications/issn', passportMiddlewares.token, createPublicationsRouterIssn(db, combineUserInfo));
	app.use('/requests/publications/issn', passportMiddlewares.token, createRequestsPublicationsRouterIssn(db, combineUserInfo));
	app.use('/ranges', passportMiddlewares.token, createRangesRouter(db, combineUserInfo));
	app.use('/auth', authenticationRouter(db, passportMiddlewares));

	const server = app.listen(HTTP_PORT, () => {
		Logger.log('info', 'Started identifier-services-api');
	});

	async function combineUserInfo(req, res, next) {
		const response = await db.collection('userMetadata').findOne({id: req.user.id});
		req.user = {...req.user, ...response};
		next();
	}

	registerSignalHandlers();

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
}
