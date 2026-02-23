import HttpStatus from 'http-status';

import { ApiError } from '../../utils/api-error.ts';
import { DateTime } from 'luxon';

export function validateGetById<T>(dbResult: T[]): T {
  if (dbResult.length === 0 || dbResult[0] === undefined) {
    throw new ApiError(HttpStatus.NOT_FOUND, 'Not found', 'Requested entry could not be found');
  }

  if (dbResult.length > 1) {
    throw new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Internal server error',
      'Found multiple entities with given ID. Refusing to process.',
    );
  }

  return dbResult[0];
}

export function getCurrentTime() {
  return DateTime.utc().toJSDate();
}
