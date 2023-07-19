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

import {readEnvironmentVariable} from '@natlibfi/melinda-backend-commons';
import {parseBoolean} from './utils';

// ENV
export const NODE_ENV = readEnvironmentVariable('NODE_ENV', {defaultValue: 'development'});

// DB CONNECTION
export const DB_URI = readEnvironmentVariable('DB_URI', {defaultValue: 'sqlite::memory'});
export const DB_DIALECT = readEnvironmentVariable('DB_DIALECT', {defaultValue: 'sqlite'});
export const DB_DIALECT_OPTIONS = readEnvironmentVariable('DB_DIALECT_OPTIONS', {defaultValue: {}, format: JSON.parse});

export const TABLE_PREFIX = readEnvironmentVariable('TABLE_PREFIX', {defaultValue: 'system'});

// FORMS
// Note: affects statistics generation as well as identifier used as user placeholder during form generation
export const WEBSITE_USER = readEnvironmentVariable('WEBSITE_USER', {defaultValue: 'EXAMPLE'});

export const KEYCLOAK_ALGORITHMS = readEnvironmentVariable('KEYCLOAK_ALGORITHMS', {defaultValue: [], format: JSON.parse});
export const KEYCLOAK_AUDIENCE = readEnvironmentVariable('KEYCLOAK_AUDIENCE', {defaultValue: ''});
export const KEYCLOAK_ISSUER = readEnvironmentVariable('KEYCLOAK_ISSUER', {defaultValue: ''});
export const KEYCLOAK_JWKS_URL = readEnvironmentVariable('KEYCLOAK_JWKS_URL', {defaultValue: ''});
export const ROLE_MAP = readEnvironmentVariable('ROLE_MAP', {defaultValue: {}, format: JSON.parse});

export const PASSPORT_LOCAL_USERS = readEnvironmentVariable('PASSPORT_LOCAL_USERS');

// CORS, USER AGENTS, PROXIES
export const UI_URL = readEnvironmentVariable('UI_URL', {defaultValue: 'http://localhost:8080'});
export const CORS_WHITELIST = readEnvironmentVariable('CORS_WHITELIST', {defaultValue: ['http://localhost:8080'], format: JSON.parse});

export const ENABLE_PROXY = readEnvironmentVariable('ENABLE_PROXY', {defaultValue: false, format: parseBoolean});

// CONNECTIONS CONFIG
export const HTTP_PORT = readEnvironmentVariable('HTTP_PORT', {defaultValue: 8080, format: v => Number(v)});
export const HTTPS_PORT = readEnvironmentVariable('HTTPS_PORT', {defaultValue: 443, format: v => Number(v)});

export const TLS_KEY = readEnvironmentVariable('TLS_KEY', {defaultValue: ''});
export const TLS_CERT = readEnvironmentVariable('TLS_CERT', {defaultValue: ''});

// METADATA DELIVERY
export const MELINDA_API_URL = readEnvironmentVariable('MELINDA_API_URL', {defaultValue: ''});
export const MELINDA_API_USER = readEnvironmentVariable('MELINDA_API_USER', {defaultValue: ''});
export const MELINDA_API_PASSWORD = readEnvironmentVariable('MELINDA_API_PASSWORD', {defaultValue: ''});
export const MELINDA_CREATE_RECORD_PARAMS = readEnvironmentVariable('MELINDA_CREATE_RECORD_PARAMS', {defaultValue: {}, format: JSON.parse});
export const MELINDA_SRU_URL = readEnvironmentVariable('MELINDA_SRU_URL', {defaultValue: ''});

// EMAIL CONFIG
// Note: For other NODE environments than production/development, emails are always disabled
/* eslint-disable no-process-env*/
export const SEND_EMAILS = ['production', 'development'].includes(NODE_ENV) ? readEnvironmentVariable('SEND_EMAILS', {defaultValue: false, format: parseBoolean}) : false;
export const SMTP_CONFIG = ['production', 'development'].includes(NODE_ENV) ? readEnvironmentVariable('SMTP_CONFIG', {defaultValue: {}, format: JSON.parse}) : {};
export const ISBN_EMAIL = readEnvironmentVariable('ISBN_EMAIL', {defaultValue: ''});
export const ISSN_EMAIL = readEnvironmentVariable('ISSN_EMAIL', {defaultValue: ''});
/* eslint-enable no-process-env*/

// MESSAGE TYPE CONFIG
// IMPORTANT NOTE: defaults are utilized in tests, change these defaults and you will break tests
export const MESSAGE_TYPE_CONFIG_ISBN = readEnvironmentVariable('MESSAGE_TYPE_CONFIG_ISBN', {
  defaultValue: {
    'big_publisher_isbn': 1,
    'big_publisher_ismn': 2,
    'publisher_registered_isbn': 3,
    'publisher_registered_ismn': 4,
    'identifier_created_isbn': 5,
    'identifier_created_ismn': 6
  },
  format: JSON.parse
});

export const MESSAGE_TYPE_CONFIG_ISSN = readEnvironmentVariable('MESSAGE_TYPE_CONFIG_ISSN', {
  defaultValue: {
    'form_handled': 1,
    'publisher_summary': 2
  },
  format: JSON.parse
});

// OTHER CONFIG, NOTE: defaults are utilized in tests
export const AUTHOR_PUBLISHER_ID_ISBN = readEnvironmentVariable('AUTHOR_PUBLISHER_ID_ISBN', {defaultValue: 1, format: v => parseInt(v, 10)});
export const STATE_PUBLISHER_ID_ISBN = readEnvironmentVariable('STATE_PUBLISHER_ID_ISBN', {defaultValue: 2, format: v => parseInt(v, 10)});
export const UNIVERSITY_PUBLISHER_ID_ISBN = readEnvironmentVariable('UNIVERSITY_PUBLISHER_ID_ISBN', {defaultValue: 3, format: v => parseInt(v, 10)});

// TURNSTILE CONFIG
export const TURNSTILE_URL = readEnvironmentVariable('TURNSTILE_URL', {defaultValue: ''});
export const TURNSTILE_SECRET_KEY = readEnvironmentVariable('TURNSTILE_SECRET_KEY', {defaultValue: ''});
export const DISABLE_TURNSTILE = readEnvironmentVariable('DISABLE_TURNSTILE', {defaultValue: false, format: parseBoolean});
