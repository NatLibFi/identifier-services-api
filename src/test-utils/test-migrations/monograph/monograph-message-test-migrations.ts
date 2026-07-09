import type { Kysely } from 'kysely';
import type { Database } from '../../../db/types.ts';

export async function createMonographMessageTable(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('monograph_message')
    .addColumn('id', 'integer', (col) => col.primaryKey().notNull().autoIncrement())
    .addColumn('message_type', 'varchar(50)', (col) => col.notNull())
    .addColumn('lang_code', 'varchar(5)', (col) => col.notNull())
    .addColumn('recipient', 'varchar(100)', (col) => col.notNull())
    .addColumn('subject', 'varchar(150)', (col) => col.notNull())
    .addColumn('body', 'text', (col) => col.notNull())
    .addColumn('monograph_publisher_id', 'integer')
    .addColumn('monograph_publication_request_id', 'integer')
    .addColumn('isbn_publisher_range_id', 'integer')
    .addColumn('ismn_publisher_range_id', 'integer')
    .addColumn('sent', 'datetime', (col) => col.notNull())
    .addColumn('sent_by', 'varchar(36)', (col) => col.notNull())
    .execute();
}

export async function dropMonographMessageTable(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('monograph_message').execute();
}
