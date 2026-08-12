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
import createMonographRouter from './routes/monograph/monograph-router.ts';
import createMelindaRouter from './routes/melinda-router.ts';
import createMessageTemplateRouter from './routes/message-template-router.ts';
import testAuthenticationRouter from './routes/test-auth-router.ts';

import { allowAdminOnly } from './middlewares/auth.ts';
import { initializeTurnstileMiddleware } from './middlewares/turnstile.ts';

import { createKyselySingleton, testDatabaseConnection } from './db/database.ts';
import { createApplicationLogger, createExpressLogger } from './utils/logging.ts';
import { isAutomatedTest } from './utils/generic-utils.ts';

import packageJson from '../package.json' with { type: 'json' };

export interface KeycloakOptions {
  algorithms?: string[];
  audience?: string;
  issuer?: string;
  jwksUrl?: string;
  localUsers?: string;
}

export type ApplicationRoleMap = Record<string, string[]>;

export interface MonographPublisherConfiguration {
  SELF_PUBLISHER_ID: number;
  STATE_PUBLISHER_ID: number;
  HY_PUBLISHER_ID: number;
}

export interface MessagingConfiguration {
  SEND_EMAILS: boolean;
  SMTP_CONFIG: Record<string, unknown>;
  ISBN_EMAIL: string;
  ISSN_EMAIL: string;
}

export interface TurnstileConfiguration {
  TURNSTILE_URL: string;
  TURNSTILE_SECRET_KEY: string;
  DISABLE_TURNSTILE: boolean;
}

export interface MelindaConfiguration {
  MELINDA_API_URL: string;
  MELINDA_API_USER: string;
  MELINDA_API_PASSWORD: string;
}

interface AppOptions {
  applicationRoleMap: ApplicationRoleMap;
  monographPublisherConfiguration: MonographPublisherConfiguration;
  messagingConfiguration: MessagingConfiguration;
  melindaConfiguration: MelindaConfiguration;
  turnstileConfiguration: TurnstileConfiguration;
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
    httpPort,
    keycloakOptions,
    logLevel,
    proxyCustomHeader,
    monographPublisherConfiguration,
    messagingConfiguration,
    melindaConfiguration,
    turnstileConfiguration,
  } = options;

  const logger = createApplicationLogger(logLevel);

  logger.info('Start initializing Express server');
  const app = express();
  app.disable('x-powered-by');

  if (enableProxy) {
    app.enable('trust proxy');
  }

  // Middlewares init
  const turnstileMiddleware = initializeTurnstileMiddleware(turnstileConfiguration);
  const corsOrigin = isAutomatedTest() ? false : corsWhitelist;
  const { localUsers, ...keycloakOpts } = keycloakOptions || {};

  if (localUsers && !isAutomatedTest()) {
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

  // Log important parts of configuration
  if (messagingConfiguration.SEND_EMAILS) {
    logger.info('Sending emails is enabled');
  } else {
    logger.info('Sending emails is disabled');
  }

  // Routes
  if (isAutomatedTest()) {
    logger.warn('Enabling test authentication route');
    app.use('/test-auth', passportMiddlewares.credentials, testAuthenticationRouter);
  }

  if (!isAutomatedTest()) {
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
  const monographRouter = createMonographRouter(
    monographPublisherConfiguration,
    messagingConfiguration,
    turnstileMiddleware.validateTurnstile,
  );
  const melindaRouter = createMelindaRouter(melindaConfiguration);
  const messageTemplateRouter = createMessageTemplateRouter();

  app.use('/v2/monograph', monographRouter);
  app.use('/v2/melinda', allowAdminOnly, melindaRouter);
  app.use('/v2/message-templates', allowAdminOnly, messageTemplateRouter);

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
