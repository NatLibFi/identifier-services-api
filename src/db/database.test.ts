import { afterEach, beforeEach, test, describe, inject, expect } from 'vitest';

import { createConnection, type Connection } from 'mysql2/promise';
import { CompiledQuery, Kysely } from 'kysely';
import { v4 as UUIDv4 } from 'uuid';

import type { Database } from './types.ts';
import { createKyselySingleton, dropKyselySingleton, getKysely } from './database.ts';

// Note: these tests test database creation and as such they do not utilize test helpers
// That other test requiring test database utilize
describe('database', async () => {
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

  test('can create to database successfully using test config', async () => {
    // Note: must create database before Kysely can access it

    // @ts-expect-error implicit object type
    createKyselySingleton({ ...dbConfig, database });
    const db: Kysely<Database> = getKysely();

    expect(db).toBeInstanceOf(Kysely);

    const testQueryResult = await db.executeQuery(CompiledQuery.raw(`SELECT 1 AS result`));
    expect(Array.isArray(testQueryResult.rows)).toBe(true);
    expect(testQueryResult.rows.length).toBe(1);
    expect(testQueryResult.rows[0]).toStrictEqual({ result: 1 });

    // Drop Kysely singleton
    dropKyselySingleton();
  });

  test('throws error when attempting to create database multiple times', async () => {
    // Attempt create two Kysely instances

    // @ts-expect-error implicit object type
    createKyselySingleton({ ...dbConfig, database });

    // @ts-expect-error implicit object type
    expect(() => createKyselySingleton({ ...dbConfig, database })).toThrowError();

    // Drop successfully created Kysely singleton
    dropKyselySingleton();
  });

  test('allows getting same Kysely singleton multiple times', async () => {
    // Create Kysely instance

    // @ts-expect-error implicit object type
    createKyselySingleton({ ...dbConfig, database });

    // Get instance once
    const foo = getKysely();
    expect(foo).toBeInstanceOf(Kysely);

    // Assert that getting instance second time does not throw error
    expect(() => getKysely()).not.toThrowError();
  });
});
