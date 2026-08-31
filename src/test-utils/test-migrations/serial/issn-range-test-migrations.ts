import type { Kysely } from 'kysely';
import type { Database } from '../../../db/types.ts';

export async function createIssnRangeTable(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('issn_range')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement().notNull())
    .addColumn('block', 'varchar(4)', (col) => col.notNull())
    .addColumn('range_begin', 'varchar(4)', (col) => col.notNull())
    .addColumn('range_end', 'varchar(4)', (col) => col.notNull())
    .addColumn('active', 'boolean', (col) => col.notNull())
    .addColumn('created', 'datetime', (col) => col.notNull())
    .addColumn('created_by', 'varchar(36)')
    .addColumn('modified', 'datetime', (col) => col.notNull())
    .addColumn('modified_by', 'varchar(36)')
    .execute();

  return;
}
