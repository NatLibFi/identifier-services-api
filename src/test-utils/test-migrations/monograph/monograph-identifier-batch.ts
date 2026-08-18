import type { Kysely } from 'kysely';

import type { Database } from '../../../db/types.ts';

export async function createMonographIdentifierBatchTable(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('monograph_identifier_batch')
    .addColumn('id', 'integer', (col) => col.primaryKey().notNull().autoIncrement())
    .addColumn('monograph_publisher_id', 'integer', (col) => col.notNull())
    .addColumn('isbn_publisher_range_id', 'integer')
    .addColumn('ismn_publisher_range_id', 'integer')
    .addColumn('created', 'datetime', (col) => col.notNull())
    .addColumn('created_by', 'varchar(36)', (col) => col.notNull())
    .execute();
}

export async function dropMonographIdentifierBatchTable(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('monograph_identifier_batch').execute();
}
