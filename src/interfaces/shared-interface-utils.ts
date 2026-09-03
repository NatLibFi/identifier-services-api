import HttpStatus from 'http-status';
import { sql } from 'kysely';

import { ApiError } from '../utils/api-error.ts';
import { DateTime } from 'luxon';

import type { DeleteResult, ExpressionBuilder, InsertResult, ReferenceExpression, UpdateResult } from 'kysely';

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

// Validates that number of rows that were updated is exactly as given in parameter.
export function validateRowsUpdatedExact(updateResult: UpdateResult, expectedChangedRows: number) {
  if (Number(updateResult.numUpdatedRows) !== expectedChangedRows) {
    throw new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Internal server error',
      `Expected operation to change ${expectedChangedRows} rows, but operation changed ${Number(updateResult.numUpdatedRows)} rows instead.`,
    );
  }

  return;
}

// Validates that number of rows that were updated is at most as given in parameter. Updates updating less than max number of rows are also accepted.
export function validateRowsUpdatedMax(updateResult: UpdateResult, expectedMaxChangedRows: number) {
  if (Number(updateResult.numUpdatedRows) > expectedMaxChangedRows) {
    throw new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Internal server error',
      `Expected operation to change ${expectedMaxChangedRows} rows at maximum, but operation changed ${Number(updateResult.numUpdatedRows)} rows instead.`,
    );
  }

  return;
}

export function validateRowsDeleted(deleteResult: DeleteResult, expectedDeletedRows: number) {
  if (deleteResult.numDeletedRows !== BigInt(expectedDeletedRows)) {
    throw new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Internal server error',
      `Expected operation to delete ${expectedDeletedRows} rows, but operation changed ${Number(deleteResult.numDeletedRows)} rows instead.`,
    );
  }

  return;
}

export function validateRowsInserted(insertResult: InsertResult, expectedInsertedRows: number) {
  if (insertResult.numInsertedOrUpdatedRows !== BigInt(expectedInsertedRows)) {
    throw new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Internal server error',
      `Expected operation to insert ${expectedInsertedRows} rows, but operation inserted ${Number(insertResult.numInsertedOrUpdatedRows)} rows instead.`,
    );
  }

  return;
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
  const conditions = attributeList.map((attr) => eb(eb.fn('lower', attr), 'like', searchText));
  return eb.or(conditions);
}

export function constructJsonContainsSearch<DB, TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  attribute: ReferenceExpression<DB, TB>,
  searchText: string,
) {
  return eb(eb.fn('lower', [eb.fn('json_extract', [attribute, sql.lit('$')])]), 'like', searchText);
}
