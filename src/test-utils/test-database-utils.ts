import { v4 as UUIDv4 } from 'uuid';

import type { Kysely } from 'kysely';
import type { PoolOptions } from 'mysql2';
import { createConnection } from 'mysql2/promise';
import { expect } from 'vitest';

import { createKyselySingleton, dropKyselySingleton, getKysely } from '../db/database.ts';
import { createIsbnRangeTable } from './test-migrations/isbn-range.ts';
import type { Database } from '../db/types.ts';
import type { UnknownObject } from '../generic-types.ts';

interface TestDatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

type TestDatabaseTableInit = Record<string, string>;

interface TestDatabaseTableInfo {
  table: string;
  constructorFn: (db: Kysely<Database>) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataEntries: Record<string, any>[];
}

// Creates test database using UUIDv4 as db name to avoid collisions to reasonable degree.
export async function createTestDatabase(dbConfig: PoolOptions): Promise<string> {
  const database = UUIDv4();

  const mysql2Connection = await createConnection(dbConfig);
  await mysql2Connection.query(`CREATE DATABASE \`${database}\``);

  return database;
}

export async function dropTestDatabase(dbConfig: TestDatabaseConfig, database: string): Promise<boolean> {
  const mysql2Connection = await createConnection(dbConfig);
  await mysql2Connection.query(`DROP DATABASE IF EXISTS \`${database}\``);

  dropKyselySingleton();

  return true;
}

export async function initializeTestDb(dbConfig: PoolOptions, dbInit: Record<string, TestDatabaseTableInit[]>) {
  const database = await createTestDatabase(dbConfig);
  const db = createKyselySingleton({ ...dbConfig, database });

  const tables = Object.keys(dbInit);
  const tableInfos = tables.map((table) => getTableInfo(dbInit, table));
  await Promise.all(tableInfos.map((tableInfo) => initTable(db, tableInfo)));

  // Note: This return value is needed for dropping db later in tests
  return database;
}

export async function validateDbState(dbExpected: UnknownObject) {
  const db = getKysely();

  const expectedTables = Object.keys(dbExpected);
  const dbTablesRaw = await db.introspection.getTables();
  const dbTables = dbTablesRaw.map(({ name }) => name);

  // Verify there are no more or less tables than expected
  expect(expectedTables).toStrictEqual(dbTables);

  // Now it's safe to verify table content by iterating through each expected table as we know tables match
  await Promise.all(
    expectedTables.map(async (table) => {
      const expectedTableContent = dbExpected[table];
      expectedTableContent.forEach(fixObjectDateInfo);

      // @ts-expect-error dynamically inserted table name
      const dbTableContent = await db.selectFrom(table).selectAll().execute();
      expect(dbTableContent).toStrictEqual(expectedTableContent);
    }),
  );
}

function getTableInfo(dbInit: Record<string, TestDatabaseTableInit[]>, table: string): TestDatabaseTableInfo {
  const tableInfoMap: Record<string, TestDatabaseTableInfo> = {
    isbn_range: {
      table: 'isbn_range',
      constructorFn: createIsbnRangeTable,
      // @ts-expect-error implicit expectation of having defined key for tests
      dataEntries: dbInit['isbn_range'],
    },
  };

  const result = tableInfoMap[table];

  if (!result) {
    throw new Error(
      `Database initialization defined key of ${table} which is not supported currently. Please check test-database-utils.ts:getTableInfo regarding available keys for dbInit.json.`,
    );
  }

  const hasDataEntries = result.dataEntries && Array.isArray(result.dataEntries);
  const dataEntriesAreObjects =
    hasDataEntries && result.dataEntries.every((dataEntry) => typeof dataEntry === 'object');

  if (!hasDataEntries || !dataEntriesAreObjects) {
    throw new Error(
      `Table ${table} was defined to be included to test database initialization, but it does not contain any entries that seem valid`,
    );
  }

  return result;
}

async function initTable(db: Kysely<Database>, tableInfo: TestDatabaseTableInfo) {
  const { dataEntries, table } = tableInfo;
  await tableInfo.constructorFn(db);

  dataEntries.forEach(fixObjectDateInfo);

  // Insert entries to table. This will throw error if definitions in dbInit do not match table schema.
  // @ts-expect-error dynamic insert
  await db.insertInto(table).values(dataEntries).execute();
}

// Note: fixes object attribute in place so it's not a pure function
// This fix is required due to not being able to store Date objects within json definitions
function fixObjectDateInfo(object: UnknownObject) {
  const dateAttributes = ['created', 'modified'];

  dateAttributes.forEach((dateAttribute) => {
    const hasAttribute = Object.keys(object).includes(dateAttribute);
    if (!hasAttribute) {
      return;
    }

    const attrAsDate = new Date(object[dateAttribute]);
    object[dateAttribute] = attrAsDate;
  });
}
