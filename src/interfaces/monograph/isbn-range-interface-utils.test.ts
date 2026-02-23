import { afterEach, beforeEach, test, describe, inject, expect } from 'vitest';

import { createConnection, type Connection } from 'mysql2/promise';
import { v4 as UUIDv4 } from 'uuid';

import { createKyselySingleton, dropKyselySingleton } from '../../db/database.ts';
import { getIsbnRangeConflict } from './isbn-range-interface-utils.ts';
import { createIsbnRangeTable } from '../../test-utils/test-migrations/isbn-range.ts';

import { TEST_CREATION_DATE, TEST_MODIFICATION_DATE, TEST_USER_1 } from '../../test-utils/test-constants.ts';

import type { CreateIsbnRangeHttp } from '../../validations/monograph/isbn-range-validation.ts';

describe('getIsbnRangeConflicts', async () => {
  let mysql2Connection: Connection;
  let database: string;

  // @ts-expect-error vitest injection
  // eslint-disable-next-line prefer-const
  let dbConfig = inject('dbConfig');

  const initialIsbnRange = {
    id: 1,
    gs1: '978',
    registration_group: '951',
    range_begin: '0',
    range_end: '1',
    active: true,
    created: TEST_CREATION_DATE.toJSDate(),
    created_by: TEST_USER_1,
    modified: TEST_MODIFICATION_DATE.toJSDate(),
    modified_by: TEST_USER_1,
  };

  beforeEach(async () => {
    database = UUIDv4();

    mysql2Connection = await createConnection(dbConfig);
    await mysql2Connection.query(`CREATE DATABASE \`${database}\``);

    // Insert same entry for all test cases: 978-951-0 -> 978-951-1
    // @ts-expect-error implicit object type
    const db = createKyselySingleton({ ...dbConfig, database });

    await createIsbnRangeTable(db);
    await db.insertInto('isbn_range').values(initialIsbnRange).executeTakeFirstOrThrow();
  });

  afterEach(async () => {
    await mysql2Connection.query(`DROP DATABASE \`${database}\``);
    dropKyselySingleton();
  });

  test('Finds conflict between when ranges overlap (same range length)', async () => {
    const isbnRangeCreateDoc: CreateIsbnRangeHttp = {
      gs1: '978',
      registration_group: '951',
      range_begin: '0',
      range_end: '1',
    };

    const result = await getIsbnRangeConflict(isbnRangeCreateDoc);
    expect(result).toStrictEqual([initialIsbnRange]);
  });

  test('Finds conflict between when ranges overlap (different range length) #1', async () => {
    // Note: range with begin of 1 and end of 2 takes essentially all publisher identifiers between 10000-19999
    const isbnRangeCreateDoc: CreateIsbnRangeHttp = {
      gs1: '978',
      registration_group: '951',
      range_begin: '19999',
      range_end: '21999',
    };

    const result = await getIsbnRangeConflict(isbnRangeCreateDoc);
    expect(result).toStrictEqual([initialIsbnRange]);
  });

  test('Finds conflict between when ranges overlap (different range length) #2', async () => {
    const isbnRangeCreateDoc: CreateIsbnRangeHttp = {
      gs1: '978',
      registration_group: '951',
      range_begin: '10',
      range_end: '19',
    };

    const result = await getIsbnRangeConflict(isbnRangeCreateDoc);
    expect(result).toStrictEqual([initialIsbnRange]);
  });

  test('Does not find conflict when gs1 does not match', async () => {
    const isbnRangeCreateDoc: CreateIsbnRangeHttp = {
      gs1: '979',
      registration_group: '951',
      range_begin: '0',
      range_end: '1',
    };

    const result = await getIsbnRangeConflict(isbnRangeCreateDoc);
    expect(result).toStrictEqual([]);
  });

  test('Does not find conflict when registration_group does not match', async () => {
    const isbnRangeCreateDoc: CreateIsbnRangeHttp = {
      gs1: '978',
      registration_group: '952',
      range_begin: '0',
      range_end: '1',
    };

    const result = await getIsbnRangeConflict(isbnRangeCreateDoc);
    expect(result).toStrictEqual([]);
  });

  test('Does not find conflict when gs1 and registration_group matches, but ranges do not overlap', async () => {
    const isbnRangeCreateDoc: CreateIsbnRangeHttp = {
      gs1: '978',
      registration_group: '951',
      range_begin: '20',
      range_end: '29',
    };

    const result = await getIsbnRangeConflict(isbnRangeCreateDoc);
    expect(result).toStrictEqual([]);
  });
});
