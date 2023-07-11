/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file.
 *
 * API service of Identifier Services system
 *
 * Copyright (C) 2023 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of identifier-services-api
 *
 * identifier-services-api program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * identifier-services-api is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 *
 */

/* eslint-disable max-statements,no-unused-vars,require-await*/
import {generatePassportMiddlewares} from '@natlibfi/passport-natlibfi-keycloak';
import {createLogger, createExpressLogger} from '@natlibfi/melinda-backend-commons';

import express from 'express';
import cors from 'cors';
import https from 'https';
import fs from 'fs';
import HttpStatus from 'http-status';
import {isCelebrateError} from 'celebrate';
import path from 'path';

import sequelize from './models';
import * as routes from './routes';

import {ApiError, bodyParse} from './utils';
import {getUserApplicationRoles, generateUserAuthorizationMiddleware, generatePermissionMiddleware} from './middlewares';

import {
  CORS_WHITELIST,
  ENABLE_PROXY,
  HTTP_PORT,
  KEYCLOAK_ALGORITHMS,
  KEYCLOAK_AUDIENCE,
  KEYCLOAK_ISSUER,
  KEYCLOAK_PUBLIC_KEY,
  PASSPORT_LOCAL_USERS,
  TLS_KEY,
  TLS_CERT,
  HTTPS_PORT,
  SEND_EMAILS,
  NODE_ENV
} from './config';

export default async function run() { // eslint-disable-line
  const logger = createLogger();

  // INITIALIZATION
  // Test Sequelize ORM DB connection if not running tests
  /* istanbul ignore if */
  if (NODE_ENV !== 'test') { // eslint-disable-line functional/no-conditional-statements
    try {
      await sequelize.authenticate();
      logger.info('Sequelize ORM has established database connection successfully.'); // eslint-disable-line
    } catch (error) {
      logger.error('Unable to connect to the database');
      throw new Error('Unable to connect database');
    }
  }

  // Log email config
  /* eslint-disable functional/no-conditional-statements */
  /* istanbul ignore if */
  if (SEND_EMAILS) {
    logger.warn('Sending emails is ON');
  } else {
    logger.warn('Sending emails is OFF (they will be saved to database nonetheless)');
  }
  /* eslint-enable functional/no-conditional-statements */


  const app = express();

  // Initialize passport middleware
  const passportMiddlewares = await generatePassportMiddlewares({
    keycloakOpts: {
      publicKey: KEYCLOAK_PUBLIC_KEY,
      algorithms: KEYCLOAK_ALGORITHMS,
      audience: KEYCLOAK_AUDIENCE,
      issuer: KEYCLOAK_ISSUER
    },
    localUsers: PASSPORT_LOCAL_USERS
  });

  // Initialize custom middleware that handles permissions
  const authorizationMiddleware = generateUserAuthorizationMiddleware(passportMiddlewares);
  const permissionMiddleware = generatePermissionMiddleware();
  const gatherUserInformationMiddlewares = [authorizationMiddleware, getUserApplicationRoles];

  // Initialize cors options
  function whiteListCB(origin, callback) {
    const originIsWhitelisted = !origin || CORS_WHITELIST.indexOf(origin) !== -1;
    /* eslint-disable functional/no-conditional-statements,callback-return */
    if (originIsWhitelisted) {
      callback(null, true);
    } else {
      logger.info(`Request from origin ${origin} is not whitelisted.`);
      callback(new Error('Not allowed by CORS'), false);
    }
    /* eslint-enable functional/no-conditional-statements,callback-return */
  }

  const corsOptions = {
    origin: (origin, callback) => whiteListCB(origin, callback),
    credentials: true
  };

  // Set express configurations
  app.disable('x-powered-by');
  app.enable('trust proxy', ENABLE_PROXY);
  app.use(createExpressLogger());
  app.use(cors(corsOptions));
  app.use(bodyParse());

  // ROUTES

  // Auth is available only for automated testing
  // eslint-disable-next-line functional/no-conditional-statements
  if (NODE_ENV === 'test') {
    app.use('/auth', routes.createAuthenticationRouter(passportMiddlewares)); //eslint-disable-line
  }

  app.use('/', express.static(path.resolve(__dirname, 'public')));
  app.use('/ping', routes.createStatusRouter());
  app.use('/public', routes.createPublicRouter());

  app.use('/isbn-registry', gatherUserInformationMiddlewares, routes.createIsbnRegistryRouter({permissionMiddleware}));
  app.use('/issn-registry', gatherUserInformationMiddlewares, routes.createIssnRegistryRouter({permissionMiddleware}));

  app.use(handleErrors);

  // If TLS configuration is not provided, return http-server
  if (!TLS_CERT || !TLS_KEY) {
    const server = app.listen(HTTP_PORT, () => {
      logger.info('Started identifier-services-api http server');
    });
    return server;
  }

  /* istanbul ignore next */
  // If http-server was not returned, return https-server
  const tlsConfig = {
    key: fs.readFileSync(TLS_KEY, 'utf8'),
    cert: fs.readFileSync(TLS_CERT, 'utf8')
  };

  const server = https.createServer(tlsConfig, app).listen(HTTPS_PORT, () => {
    logger.info('Started identifier-services-api https server');
  });

  return server;

  function handleErrors(err, req, res, next) {
    logger.info('An error has occurred');

    if (err) {
      // If error was an already managed error, send defined status and message as response
      if (err instanceof ApiError) {
        logger.debug(`ApiError message: ${err.message}`);
        return res.status(err.status).json({message: err.message});
      }

      // If error was celebate error, throw appropriate status and message
      try {
        if (isCelebrateError(err)) {
          const validationErrorAttribute = err.details.get('params') ? 'params' : err.details.get('body') ? 'body' : null; // eslint-disable-line no-nested-ternary
          const validationErrorFields = validationErrorAttribute ? err.details.get(validationErrorAttribute).details.map(validationError => validationError?.context?.label).join(', ') : 'Unknown field';

          logger.info(`Validation errors were found in following labels: ${validationErrorFields}`);
          return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({message: 'Validation failed'});
        }
      } catch (unmanagedCelebrateError) {
        logger.warn('Could not manage celebrate error properly');
      }

      // If error was an unmanaged error, throw unknown error status and message
      logger.warn('Error was not a managed one. Won\'t display more without debug mode activated');
      logger.debug(`Unknown error produced following message: ${err.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({message: 'Unknown error occurred'});
    }

    next();
  }
}
