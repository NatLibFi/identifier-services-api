import {
  envFormatBoolean,
  envFormatNumeric,
  envFormatStringArray,
  envGetApplicationRoleMap,
  envGetKeycloakAlgorithms,
  readEnvironmentVariable,
} from './utils/config-utils.ts';

import type { ApplicationRoleMap, KeycloakOptions } from './app.ts';

// COMMON
export const NODE_ENV = readEnvironmentVariable<string>('NODE_ENV');
export const HTTP_PORT = readEnvironmentVariable<number>('HTTP_PORT', {
  formatFunction: envFormatNumeric,
});

// DB
export const DATABASE_CONFIG = {
  host: readEnvironmentVariable<string>('DB_HOST'),
  user: readEnvironmentVariable<string>('DB_USER'),
  password: readEnvironmentVariable<string>('DB_PASSWORD'),
  database: readEnvironmentVariable<string>('DB_DATABASE'),
  charset: 'UTF8_SWEDISH_CI',
  ssl: {
    // Allow unverified connections only during development
    rejectUnauthorized: NODE_ENV !== 'development',
  },
};

// Security
export const APPLICATION_ROLE_MAP = readEnvironmentVariable<ApplicationRoleMap>('APPLICATION_ROLE_MAP', {
  defaultValue: {},
  formatFunction: envGetApplicationRoleMap,
});

export const CORS_WHITELIST = readEnvironmentVariable<string[]>('CORS_WHITELIST', {
  defaultValue: [],
  formatFunction: envFormatStringArray,
});

export const ENABLE_PROXY = readEnvironmentVariable<boolean>('ENABLE_PROXY', {
  defaultValue: false,
  formatFunction: envFormatBoolean,
});

export const KEYCLOAK_OPTIONS: KeycloakOptions = {
  algorithms: readEnvironmentVariable<string[]>('KEYCLOAK_ALGORITHMS', {
    defaultValue: [],
    formatFunction: envGetKeycloakAlgorithms,
  }),
  audience: readEnvironmentVariable('KEYCLOAK_AUDIENCE'),
  issuer: readEnvironmentVariable('KEYCLOAK_ISSUER'),
  jwksUrl: readEnvironmentVariable('KEYCLOAK_JWKS_URL'),
};

// Logging
export const LOG_LEVEL = readEnvironmentVariable<string>('LOG_LEVEL', { defaultValue: 'info' });
export const PROXY_CUSTOM_HEADER = readEnvironmentVariable<string>('PROXY_CUSTOM_HEADER', {
  defaultValue: '',
});
