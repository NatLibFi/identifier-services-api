import { afterEach, beforeEach, test, describe, inject, expect } from 'vitest';

import { createConnection, type Connection } from 'mysql2/promise';
import { v4 as UUIDv4 } from 'uuid';

import { createKyselySingleton, dropKyselySingleton } from '../../db/database.ts';
import { getIsmnRangeConflict } from './ismn-range-interface-utils.ts';
import { createIsmnRangeTable } from '../../test-utils/test-migrations/monograph/ismn-range-test-migrations.ts';

import { ISMN_VALID_GS1, ISMN_VALID_REGISTRATION_GROUPS } from '../../constants/monograph/ismn-constants.ts';
import { TEST_CREATION_DATE, TEST_MODIFICATION_DATE, TEST_USER_1 } from '../../test-utils/test-constants.ts';

import type { CreateIsmnRangeHttp } from '../../validations/monograph/ismn-range-validation.ts';

describe('getIsmnRangeConflicts', async () => {
  let mysql2Connection: Connection;
  let database: string;

  // @ts-expect-error vitest injection
  // eslint-disable-next-line prefer-const
  let dbConfig = inject('dbConfig');

  const initialIsmnRange = {
    id: 1,
    gs1: ISMN_VALID_GS1['979'],
    registration_group: ISMN_VALID_REGISTRATION_GROUPS['0'],
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

    await createIsmnRangeTable(db);
    await db.insertInto('ismn_range').values(initialIsmnRange).executeTakeFirstOrThrow();
  });

  afterEach(async () => {
    await mysql2Connection.query(`DROP DATABASE \`${database}\``);
    await mysql2Connection.destroy();
    await dropKyselySingleton();
  });

  test('Finds conflict between when ranges overlap (same range length)', async () => {
    const ismnRangeCreateDoc: CreateIsmnRangeHttp = {
      gs1: ISMN_VALID_GS1['979'],
      registration_group: ISMN_VALID_REGISTRATION_GROUPS['0'],
      range_begin: '0',
      range_end: '1',
    };

    const result = await getIsmnRangeConflict(ismnRangeCreateDoc);
    expect(result).toStrictEqual([initialIsmnRange]);
  });

  test('Finds conflict between when ranges overlap (different range length) #1', async () => {
    // Note: range with begin of 1 and end of 2 takes essentially all publisher identifiers between 10000-19999
    const ismnRangeCreateDoc: CreateIsmnRangeHttp = {
      gs1: ISMN_VALID_GS1['979'],
      registration_group: ISMN_VALID_REGISTRATION_GROUPS['0'],
      range_begin: '19999',
      range_end: '21999',
    };

    const result = await getIsmnRangeConflict(ismnRangeCreateDoc);
    expect(result).toStrictEqual([initialIsmnRange]);
  });

  test('Finds conflict between when ranges overlap (different range length) #2', async () => {
    const ismnRangeCreateDoc: CreateIsmnRangeHttp = {
      gs1: ISMN_VALID_GS1['979'],
      registration_group: ISMN_VALID_REGISTRATION_GROUPS['0'],
      range_begin: '10',
      range_end: '19',
    };

    const result = await getIsmnRangeConflict(ismnRangeCreateDoc);
    expect(result).toStrictEqual([initialIsmnRange]);
  });

  test('Does not find conflict when registration_group does not match', async () => {
    const ismnRangeCreateDoc: CreateIsmnRangeHttp = {
      gs1: ISMN_VALID_GS1['979'],
      registration_group: '2', // Unallocated for now, but might be allocated to ISMN in future
      range_begin: '0',
      range_end: '1',
    };

    const result = await getIsmnRangeConflict(ismnRangeCreateDoc);
    expect(result).toStrictEqual([]);
  });

  test('Does not find conflict when gs1 and registration_group matches, but ranges do not overlap', async () => {
    const ismnRangeCreateDoc: CreateIsmnRangeHttp = {
      gs1: ISMN_VALID_GS1['979'],
      registration_group: ISMN_VALID_REGISTRATION_GROUPS['0'],
      range_begin: '20',
      range_end: '29',
    };

    const result = await getIsmnRangeConflict(ismnRangeCreateDoc);
    expect(result).toStrictEqual([]);
  });
});
