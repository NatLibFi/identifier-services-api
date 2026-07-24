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

// Messaging
export const MONOGRAPH_PUBLISHER_CONFIGURATION = readEnvironmentVariable('MONOGRAPH_PUBLISHER_CONFIGURATION', {
  formatFunction: JSON.parse,
});

export const MESSAGING_CONFIGURATION = {
  // Never allow emails to be sent from other than production or staging.
  SEND_EMAILS: ['production', 'staging'].includes(NODE_ENV)
    ? readEnvironmentVariable('SEND_EMAILS', { defaultValue: false, formatFunction: envFormatBoolean })
    : false,
  SMTP_CONFIG: ['production', 'staging'].includes(NODE_ENV)
    ? readEnvironmentVariable('SMTP_CONFIG', { defaultValue: {}, formatFunction: JSON.parse })
    : {},
  ISBN_EMAIL: ['production', 'staging'].includes(NODE_ENV)
    ? readEnvironmentVariable('ISBN_EMAIL', { defaultValue: '' })
    : '',
  ISSN_EMAIL: ['production', 'staging'].includes(NODE_ENV)
    ? readEnvironmentVariable('ISSN_EMAIL', { defaultValue: '' })
    : '',
};

// Metadata delivery to Melinda
export const MELINDA_CONFIGURATION = {
  MELINDA_API_URL: readEnvironmentVariable('MELINDA_API_URL', { defaultValue: '' }),
  MELINDA_API_USER: readEnvironmentVariable('MELINDA_API_USER', { defaultValue: '' }),
  MELINDA_API_PASSWORD: readEnvironmentVariable('MELINDA_API_PASSWORD', { defaultValue: '' }),
};

// Turnstile
export const TURNSTILE_CONFIGURATION = {
  // https://developers.cloudflare.com/turnstile/get-started/server-side-validation/#siteverify-api-overview
  TURNSTILE_URL: readEnvironmentVariable('TURNSTILE_URL', {
    defaultValue: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
  }),
  TURNSTILE_SECRET_KEY: readEnvironmentVariable('TURNSTILE_SECRET_KEY', { defaultValue: '' }),
  DISABLE_TURNSTILE: readEnvironmentVariable('DISABLE_TURNSTILE', {
    defaultValue: false,
    formatFunction: envFormatBoolean,
  }),
};
