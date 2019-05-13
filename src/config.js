import {Utils} from '@natlibfi/melinda-commons';
const {readEnvironmentVariable, parseBoolean} = Utils;

export const API_URL = readEnvironmentVariable('API_URL', {
	defaultValue: 'http://localhost:5000'
});
export const HTTP_PORT = readEnvironmentVariable('HTTP_PORT', {
	defaultValue: 5000,
	format: v => Number(v)
});

export const MONGO_URI = readEnvironmentVariable('MONGO_URI', {
	defaultValue: 'mongodb+srv://ProblemChild:hHILeEi59eGIZ74u@identifierservices-ejdak.gcp.mongodb.net/IdentifierServices'
	// DefaultValue: 'mongodb://127.0.0.1:1337/db'
});

export const MONGO_DEBUG = readEnvironmentVariable('MONGO_DEBUG', {
	defaultValue: false,
	format: parseBoolean
});

export const ENABLE_PROXY = readEnvironmentVariable('ENABLE_PROXY', {
	defaultValue: false,
	format: parseBoolean
});
