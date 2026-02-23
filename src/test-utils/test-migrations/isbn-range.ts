import type { Kysely } from 'kysely';
import type { Database } from '../../db/types.ts';

export async function createIsbnRangeTable(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('isbn_range')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement().notNull())
    .addColumn('gs1', 'varchar(3)', (col) => col.notNull())
    .addColumn('registration_group', 'varchar(3)', (col) => col.notNull())
    .addColumn('range_begin', 'varchar(7)', (col) => col.notNull())
    .addColumn('range_end', 'varchar(7)', (col) => col.notNull())
    .addColumn('active', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('created', 'datetime', (col) => col.notNull())
    .addColumn('created_by', 'varchar(36)')
    .addColumn('modified', 'datetime', (col) => col.notNull())
    .addColumn('modified_by', 'varchar(36)')
    .execute();
}

export async function dropIsbnRangeTable(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('isbn_range').execute();
}
