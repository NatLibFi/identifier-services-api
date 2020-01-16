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
import {ApiError} from '@natlibfi/identifier-services-commons';
import HttpStatus from 'http-status';

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
	createApiDocRouter,
	authenticationRouter
} from './routes';
import {bodyParse, mapGroupToRole} from './utils';
import {
	whiteList,
	ENABLE_PROXY,
	MONGO_URI, HTTP_PORT,
	USER_AGENT_LOGGING_BLACKLIST,
	CROWD_URL,
	CROWD_APP_NAME,
	CROWD_APP_PASSWORD,
	PASSPORT_LOCAL_USERS,
	PRIVATE_KEY_URL
} from './config';

import generateUserProvider from './userProvider';

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
			url: `${CROWD_URL}/rest`, useCache: true, fetchGroupMembership: true
		},
		localUsers: PASSPORT_LOCAL_USERS
	});

	const userProvider = generateUserProvider({
		CROWD_URL: CROWD_URL,
		CROWD_APP_NAME: CROWD_APP_NAME,
		CROWD_APP_PASSWORD: CROWD_APP_PASSWORD,
		PASSPORT_LOCAL_USERS: PASSPORT_LOCAL_USERS,
		PRIVATE_KEY_URL: PRIVATE_KEY_URL,
		db: db
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

	app.use('/', createApiDocRouter());
	app.use('/templates', passportMiddlewares.token, combineUserInfo, createMessageTemplate(db));
	app.use('/users', passportMiddlewares.token, combineUserInfo, createUsersRouter(userProvider));
	app.use('/requests/users', passportMiddlewares.token, combineUserInfo, createRequestsUsersRouter(userProvider));
	app.use('/publishers', createPublishersRouter(db, passportMiddlewares, combineUserInfo));
	app.use('/requests/publishers', passportMiddlewares.token, combineUserInfo, createPublishersRequestsRouter(db));
	app.use('/publications/isbn-ismn', passportMiddlewares.token, combineUserInfo, createPublicationsRouterIsbnIsmn(db));
	app.use('/requests/publications/isbn-ismn', passportMiddlewares.token, combineUserInfo, createRequestsPublicationsRouterIsbnIsmn(db));
	app.use('/publications/issn', passportMiddlewares.token, combineUserInfo, createPublicationsRouterIssn(db));
	app.use('/requests/publications/issn', passportMiddlewares.token, combineUserInfo, createRequestsPublicationsRouterIssn(db));
	app.use('/ranges', passportMiddlewares.token, combineUserInfo, createRangesRouter(db));
	app.use('/auth', authenticationRouter(db, passportMiddlewares));

	const server = app.listen(HTTP_PORT, () => {
		Logger.log('info', 'Started identifier-services-api');
	});

	registerSignalHandlers();
	return server;

	async function combineUserInfo(req, res, next) {
		try {
			const response = await db.collection('userMetadata').findOne({id: req.user.id});
			if (response === null) {
				throw new ApiError(HttpStatus.NOT_FOUND);
			}

			req.user = {...req.user, role: mapGroupToRole(req.user.groups), ...response};
			next();
		} catch (err) {
			next(err);
		}
	}

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
