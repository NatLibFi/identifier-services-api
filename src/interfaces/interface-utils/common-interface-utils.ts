import HttpStatus from 'http-status';

import { ApiError } from '../../utils/api-error.ts';
import { DateTime } from 'luxon';

import type { ExpressionBuilder } from 'kysely';

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

export function removeUndefinedProperties<T>(entity: Partial<T>) {
  if (typeof entity !== 'object' || entity === null || Object.keys(entity).length === 0) {
    throw new Error(
      'Given entry is not supported for removeUndefinedAttributes: verify paramtere is an object containing at least one property',
    );
  }

  Object.keys(entity).forEach((key) => {
    const value = entity[key as keyof T];
    if (value === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete entity[key as keyof T];
    }
  });

  return entity;
}

export function constructTextLikeSearch<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  attributeList: string[],
  searchText: string,
) {
  // @ts-expect-error dynamically constructed conditions
  const conditions = attributeList.map((attr) => eb(attr, 'like', `%${searchText}%`));
  return eb.or(conditions);
}
