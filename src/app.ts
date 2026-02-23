import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import http from 'http';
import type { PoolOptions } from 'mysql2';
import qs from 'qs';

import { generatePassportMiddlewares } from '@natlibfi/passport-natlibfi-keycloak';

import { generateAuthenticationMiddleware, generateRoleMapMiddleware } from './middlewares/auth.ts';
import handleErrors from './middlewares/handle-errors.ts';
import handleNotFound from './middlewares/handle-not-found.ts';
import validateContentType from './middlewares/content-type.ts';

import healthRouter from './routes/health-router.ts';
import monographRouter from './routes/monograph/monograph-router.ts';
import testAuthenticationRouter from './routes/test-auth-router.ts';

import { createApplicationLogger, createExpressLogger } from './utils/logging.ts';
import { createKyselySingleton, testDatabaseConnection } from './db/database.ts';
import packageJson from '../package.json' with { type: 'json' };

export interface KeycloakOptions {
  algorithms?: string[];
  audience?: string;
  issuer?: string;
  jwksUrl?: string;
  localUsers?: string;
}

export type ApplicationRoleMap = Record<string, string[]>;

interface AppOptions {
  applicationRoleMap: ApplicationRoleMap;
  environment: string;
  dbConfig?: PoolOptions;
  corsWhitelist?: string[];
  enableProxy?: boolean;
  keycloakOptions?: KeycloakOptions;
  httpPort?: number;
  logLevel?: string;
  proxyCustomHeader?: string;
}

export default async function startApp(options: AppOptions): Promise<http.Server> {
  const {
    applicationRoleMap,
    corsWhitelist,
    dbConfig,
    enableProxy,
    environment,
    httpPort,
    keycloakOptions,
    logLevel,
    proxyCustomHeader,
  } = options;
  const logger = createApplicationLogger(logLevel);

  const isAutomatedTest = environment === 'test';

  logger.info('Start initializing Express server');
  const app = express();
  app.disable('x-powered-by');

  if (enableProxy) {
    app.enable('trust proxy');
  }

  // Middlewares init
  const corsOrigin = isAutomatedTest ? false : corsWhitelist;
  const { localUsers, ...keycloakOpts } = keycloakOptions || {};

  if (localUsers && !isAutomatedTest) {
    throw new Error('refusing to use local users in environment that is not an automated test');
  }

  const passportMiddlewares = generatePassportMiddlewares({
    keycloakOpts,
    localUsers,
  });

  const authenticationMiddleware = generateAuthenticationMiddleware(passportMiddlewares);
  const roleMapMiddleware = generateRoleMapMiddleware(applicationRoleMap);
  const expressLogger = createExpressLogger(logLevel, enableProxy, proxyCustomHeader);

  // Enable middlewares
  app.use(expressLogger);
  app.use(helmet());
  app.use(cors({ origin: corsOrigin, credentials: true, allowedHeaders: ['Content-Type', 'Authorization'] }));
  app.use(bodyParser.json());
  app.use(validateContentType());
  app.set('query parser', (str: string) =>
    qs.parse(str, {
      depth: 5,
      strictDepth: true,
      parseArrays: false,
      strictNullHandling: true,
    }),
  );

  logger.info('Middlewares were initialized successfully');

  // Routes
  if (isAutomatedTest) {
    logger.warn('Enabling test authentication route');
    app.use('/test-auth', passportMiddlewares.credentials, testAuthenticationRouter);
  }

  if (!isAutomatedTest) {
    logger.info('Testing database connection');

    if (!dbConfig) {
      throw new Error('Database configuration is missing. Please provide configuration to runtime environment.');
    }

    const db = createKyselySingleton(dbConfig);
    await testDatabaseConnection(db);
    logger.info('Database connection has been established successfully');
  }

  // Note: these middlewares should not be placed before automated test authentication
  app.use(authenticationMiddleware, roleMapMiddleware);

  // Routes requiring authentication
  app.use('/v2/monograph', monographRouter);

  // Public routes
  app.use('/v2', healthRouter);

  // TMP support for v1 ping
  app.use('/', healthRouter);

  // Manage not found and errors
  app.use(handleNotFound);
  app.use(handleErrors);

  logger.info(`Starting Identifier Services API v${packageJson.version} in port ${httpPort}`);
  return app.listen(httpPort);
}
