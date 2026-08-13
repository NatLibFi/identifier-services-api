import type { Kysely } from 'kysely';
import type { Database } from '../../../db/types.ts';

export async function createSerialMessageTable(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('serial_message')
    .addColumn('id', 'integer', (col) => col.primaryKey().notNull().autoIncrement())
    .addColumn('serial_publisher_id', 'integer', (col) => col.notNull())
    .addColumn('serial_publication_request_id', 'integer')
    .addColumn('message_type', 'varchar(50)', (col) => col.notNull())
    .addColumn('lang_code', 'varchar(5)', (col) => col.notNull())
    .addColumn('recipient', 'varchar(100)', (col) => col.notNull())
    .addColumn('subject', 'varchar(150)', (col) => col.notNull())
    .addColumn('body', 'text', (col) => col.notNull())
    .addColumn('sent', 'datetime', (col) => col.notNull())
    .addColumn('sent_by', 'varchar(36)', (col) => col.notNull())
    .execute();
}

export async function dropSerialMessageTable(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('serial_message').execute();
}
