import { createPool, type PoolOptions } from 'mysql2';
import { CompiledQuery, Kysely, MysqlDialect } from 'kysely';

import type { Database } from './types.ts';

let db: Kysely<Database>;

export function createKyselySingleton(dbConfig: PoolOptions) {
  if (db) {
    throw new Error('Kysely singleton already created');
  }

  const dialect = new MysqlDialect({
    pool: createPool({
      ...dbConfig,
      // Map tinyint(1) to boolean per Kysely guide
      // https://kysely.dev/docs/recipes/data-types#mysql
      typeCast(field, next) {
        if (field.type === 'TINY' && field.length === 1) {
          return field.string() === '1';
        } else {
          return next();
        }
      },
    }),
  });

  db = new Kysely<Database>({ dialect });
  return db;
}

export function getKysely() {
  if (!db) {
    throw new Error('Database has not been created yet');
  }

  return db;
}

export async function testDatabaseConnection(db: Kysely<Database>) {
  const testQueryResult = await db.executeQuery(CompiledQuery.raw(`SELECT 1`));
  const querySuccessful = !!testQueryResult && testQueryResult.rows.length > 0;

  if (querySuccessful) {
    return;
  }

  throw new Error('Could not establish database connection properly');
}

export function dropKyselySingleton() {
  if (!db) {
    throw Error('Kysely singleton was not defined and cannot be dropped');
  }

  // This function should never be used outside of tests. We can declare type safety for db to avoid unnecessary undefined checks.
  // @ts-expect-error disable typechecking for test-only case
  db = undefined;
}
