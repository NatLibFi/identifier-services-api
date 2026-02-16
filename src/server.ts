import startApp from './app.ts';
import * as config from './config.ts';

import { Server as HttpServer } from 'http';

run();

async function run() {
  const appOptions = {
    applicationRoleMap: config.APPLICATION_ROLE_MAP,
    corsWhitelist: config.CORS_WHITELIST,
    dbConfig: config.DATABASE_CONFIG,
    environment: config.NODE_ENV,
    httpPort: config.HTTP_PORT,
    keycloakOptions: config.KEYCLOAK_OPTIONS,
    logLevel: config.LOG_LEVEL,
    proxyCustomHeader: config.PROXY_CUSTOM_HEADER,
  };

  const server = await startApp(appOptions);
  registerInterruptionHandlers(server);
}

function registerInterruptionHandlers(server: HttpServer) {
  process
    .on('SIGTERM', async () => {
      await handleTermination();
    })
    .on('SIGINT', async () => {
      await handleTermination();
    })
    // Nodemon
    .on('SIGUSR2', async () => {
      await handleTermination();
    });

  async function handleTermination(code = 0) {
    server.close();
    process.exit(code);
  }
}
