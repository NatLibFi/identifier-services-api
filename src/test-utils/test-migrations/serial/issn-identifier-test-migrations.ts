import type { Kysely } from 'kysely';
import type { Database } from '../../../db/types.ts';

export async function createIssnIdentifierTable(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('issn_identifier')
    .addColumn('id', 'integer', (col) => col.primaryKey().notNull().autoIncrement())
    .addColumn('issn_range_id', 'integer', (col) => col.notNull())
    .addColumn('serial_publication_id', 'integer')
    .addColumn('identifier', 'varchar(20)', (col) => col.notNull())
    .addColumn('created', 'datetime', (col) => col.notNull())
    .addColumn('created_by', 'varchar(36)')
    .addColumn('modified', 'datetime', (col) => col.notNull())
    .addColumn('modified_by', 'varchar(36)')
    .execute();

  return;
}
