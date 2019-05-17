import {ApiError} from '@natlibfi/identifier-services-commons';
import HttpStatus from 'http-status';

export class User {
	constructor({userId, preferences, lastUpdated}) {
		this.userId = checkValue(userId);
		this.preferences = {defaultLanguage: checkValue(preferences.defaultLanguage)};
		this.lastUpdated = {timestamp: checkValue(lastUpdated.timestamp), user: checkValue(lastUpdated.user)};
	}
}

function checkValue(value) {
	if (value === undefined || value === '' || value === null) {
		throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY);
	}

	return value;
}
