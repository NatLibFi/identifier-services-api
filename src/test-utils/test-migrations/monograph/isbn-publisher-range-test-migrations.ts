import type { Kysely } from 'kysely';
import type { Database } from '../../../db/types.ts';

export async function createIsbnPublisherRangeTable(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('isbn_publisher_range')
    .addColumn('id', 'integer', (col) => col.primaryKey().notNull().autoIncrement())
    .addColumn('publisher_identifier', 'varchar(15)', (col) => col.notNull())
    .addColumn('monograph_publisher_id', 'integer', (col) => col.notNull())
    .addColumn('isbn_range_id', 'integer', (col) => col.notNull())
    .addColumn('created', 'datetime', (col) => col.notNull())
    .addColumn('created_by', 'varchar(36)')
    .addColumn('modified', 'datetime', (col) => col.notNull())
    .addColumn('modified_by', 'varchar(36)')
    .execute();
}

export async function dropIsbnPublisherRangeTable(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('isbn_publisher_range').execute();
}
