import { afterEach, beforeEach, test, describe, inject, expect } from 'vitest';

import { createConnection, type Connection } from 'mysql2/promise';
import { v4 as UUIDv4 } from 'uuid';

describe('getIsbnRangeConflict', async () => {
  let mysql2Connection: Connection;
  let database: string;

  // @ts-expect-error vitest injection
  // eslint-disable-next-line prefer-const
  let dbConfig = inject('dbConfig');

  beforeEach(async () => {
    database = UUIDv4();

    mysql2Connection = await createConnection(dbConfig);
    await mysql2Connection.query(`CREATE DATABASE \`${database}\``);
  });

  afterEach(async () => {
    await mysql2Connection.query(`DROP DATABASE \`${database}\``);
  });

  test.todo('Finds conflict between when ranges overlap (same range length)', async () => {
    expect(true).toStrictEqual(true);
  });

  test.todo('Finds conflict between when ranges overlap (different range length)', async () => {
    expect(true).toStrictEqual(true);
  });

  test.todo('Does not find conflict when gs1 does not match', async () => {
    expect(true).toStrictEqual(true);
  });

  test.todo('Does not find conflict when registration_group does not match', async () => {
    expect(true).toStrictEqual(true);
  });

  test.todo('Does not find conflict when gs1 and registration_group matches, but ranges do not overlap', async () => {
    expect(true).toStrictEqual(true);
  });
});
