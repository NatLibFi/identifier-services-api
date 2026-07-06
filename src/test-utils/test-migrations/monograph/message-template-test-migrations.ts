import type { Kysely } from 'kysely';

import type { Database } from '../../../db/types.ts';

export async function createMessageTemplateTable(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('message_template')
    .addColumn('id', 'integer', (col) => col.primaryKey().notNull().autoIncrement())
    .addColumn('name', 'varchar(150)', (col) => col.notNull())
    .addColumn('message_type', 'varchar(50)', (col) => col.notNull())
    .addColumn('lang_code', 'varchar(5)', (col) => col.notNull())
    .addColumn('subject', 'varchar(150)', (col) => col.notNull())
    .addColumn('body', 'text', (col) => col.notNull())
    .addColumn('created', 'datetime', (col) => col.notNull())
    .addColumn('created_by', 'varchar(36)', (col) => col.notNull())
    .addColumn('modified', 'datetime', (col) => col.notNull())
    .addColumn('modified_by', 'varchar(36)', (col) => col.notNull())
    .execute();
}

export async function dropMessageTemplateTable(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('message_template').execute();
}
