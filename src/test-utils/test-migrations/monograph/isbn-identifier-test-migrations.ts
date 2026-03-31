import type { Kysely } from 'kysely';
import type { Database } from '../../../db/types.ts';

export async function createIsbnIdentifierTable(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('isbn_identifier')
    .addColumn('id', 'integer', (col) => col.primaryKey().notNull().autoIncrement())
    .addColumn('identifier', 'varchar(20)', (col) => col.notNull())
    .addColumn('isbn_publisher_range_id', 'integer', (col) => col.notNull())
    .addColumn('monograph_manifestation_id', 'integer')
    .addColumn('canceled', 'boolean', (col) => col.notNull())
    .addColumn('created', 'datetime', (col) => col.notNull())
    .addColumn('created_by', 'varchar(36)')
    .addColumn('modified', 'datetime', (col) => col.notNull())
    .addColumn('modified_by', 'varchar(36)')
    .execute();
}

export async function dropIsbnIdentifierTable(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('isbn_identifier').execute();
}
