import {Utils} from '@natlibfi/melinda-commons';
const {readEnvironmentVariable, parseBoolean} = Utils;

export const API_URL = readEnvironmentVariable('API_URL', {
	defaultValue: 'http://localhost:8080'
});

export const whiteList = readEnvironmentVariable('CORS_WHITELIST', {
	defaultValue: ['http://localhost:8080'],
	format: JSON.parse
});

export const HTTP_PORT = readEnvironmentVariable('HTTP_PORT', {
	defaultValue: 8080,
	format: v => Number(v)
});

export const MONGO_URI = readEnvironmentVariable('MONGO_URI', {
	defaultValue: 'mongodb://localhost:27017/db'
});
export const PASSPORT_LOCAL_USERS = readEnvironmentVariable('PASSPORT_LOCAL_USERS');

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

