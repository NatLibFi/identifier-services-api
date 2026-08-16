import type { Kysely } from 'kysely';

import type { Database } from '../../../db/types.ts';

export async function createMonographIdentifierBatchDownloadTable(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('monograph_identifier_batch_download')
    .addColumn('id', 'integer', (col) => col.primaryKey().notNull().autoIncrement())
    .addColumn('monograph_identifier_batch_id', 'integer', (col) => col.notNull())
    .addColumn('sha256sum', 'varchar(64)', (col) => col.notNull())
    .addColumn('created', 'datetime', (col) => col.notNull())
    .execute();
}

export async function dropMonographIdentifierBatchDownloadTable(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('monograph_identifier_batch_download').execute();
}
