import {Utils} from '@natlibfi/melinda-commons';
const {readEnvironmentVariable, parseBoolean} = Utils;

export const API_URL = readEnvironmentVariable('API_URL', {
	defaultValue: 'http://localhost:8080'
});

export const SMTP_URL = readEnvironmentVariable('SMTP_URL');
export const API_EMAIL = readEnvironmentVariable('API_EMAIL');

export const API_CLIENT_USER_AGENT = readEnvironmentVariable('API_CLIENT_USER_AGENT', {defaultValue: '_RECORD-IMPORT-CONTROLLER'});
export const API_USERNAME = readEnvironmentVariable('API_USERNAME');
export const API_PASSWORD = readEnvironmentVariable('API_PASSWORD');

export const CROWD_URL = readEnvironmentVariable('CROWD_URL', {
	defaultValue: ''
});
export const CROWD_APP_NAME = readEnvironmentVariable('CROWD_APP_NAME', {
	defaultValue: ''
});
export const CROWD_APP_PASSWORD = readEnvironmentVariable('CROWD_APP_PASSWORD', {
	defaultValue: ''
});

export const whiteList = readEnvironmentVariable('CORS_WHITELIST', {
	defaultValue: ['http://localhost:8080'],
	format: JSON.parse
});

export const QUERY_LIMIT = readEnvironmentVariable('QUERY_LIMIT', {
	defaultValue: 5, format: v => Number(v)
});

export const HTTP_PORT = readEnvironmentVariable('HTTP_PORT', {
	defaultValue: 8080,
	format: v => Number(v)
});

export const MONGO_URI = readEnvironmentVariable('MONGO_URI', {
	defaultValue: 'mongodb://localhost:27017/db'
});
export const PASSPORT_LOCAL_USERS = readEnvironmentVariable('PASSPORT_LOCAL_USERS');

export const PRIVATE_KEY_URL = readEnvironmentVariable('PRIVATE_KEY_URL');
export const UI_URL = readEnvironmentVariable('UI_URL', {defaultValue: 'http://localhost:8080'});

export const MONGO_DEBUG = readEnvironmentVariable('MONGO_DEBUG', {
	defaultValue: false,
	format: parseBoolean
});

export const ENABLE_PROXY = readEnvironmentVariable('ENABLE_PROXY', {
	defaultValue: false,
	format: parseBoolean
});

export const USER_AGENT_LOGGING_BLACKLIST = readEnvironmentVariable('USER_AGENT_LOGGING_BLACKLIST', {
	defaultValue: [
		'_RECORD-IMPORT-CONTROLLER',
		'_RECORD-IMPORT-IMPORTER',
		'_RECORD-IMPORT-TRANSFORMER',
		'_RECORD-IMPORT-HARVESTER'
	],
	format: JSON.parse
});

export const GROUPS_AND_ROLES = readEnvironmentVariable('GROUPS_AND_ROLES');
