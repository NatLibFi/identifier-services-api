import type { Kysely } from 'kysely';
import type { Database } from '../../../db/types.ts';

export async function createSerialPublicationTable(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('serial_publication')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement().notNull())
    .addColumn('serial_publication_request_id', 'integer', (col) => col.notNull())
    .addColumn('title', 'varchar(200)', (col) => col.notNull())
    .addColumn('subtitle', 'varchar(200)')
    .addColumn('place_of_publication', 'varchar(100)')
    .addColumn('printer', 'varchar(100)')
    .addColumn('issued_from_year', 'varchar(4)')
    .addColumn('issued_from_number', 'varchar(100)')
    .addColumn('frequency', 'varchar(1)', (col) => col.notNull())
    .addColumn('frequency_other', 'varchar(50)')
    .addColumn('language', 'varchar(50)', (col) => col.notNull())
    .addColumn('publication_type', 'varchar(25)', (col) => col.notNull())
    .addColumn('publication_type_other', 'varchar(50)')
    .addColumn('medium', 'varchar(7)', (col) => col.notNull())
    .addColumn('medium_other', 'varchar(50)')
    .addColumn('url', 'varchar(100)')
    .addColumn('previous', 'json', (col) => col.notNull())
    .addColumn('main_series', 'json', (col) => col.notNull())
    .addColumn('sub_series', 'json', (col) => col.notNull())
    .addColumn('another_medium', 'json', (col) => col.notNull())
    .addColumn('additional_info', 'varchar(2000)')
    .addColumn('status', 'varchar(24)', (col) => col.notNull())
    .addColumn('created', 'datetime', (col) => col.notNull())
    .addColumn('created_by', 'varchar(36)')
    .addColumn('modified', 'datetime', (col) => col.notNull())
    .addColumn('modified_by', 'varchar(36)')
    .execute();
}

export async function dropSerialPublicationTable(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('serial_publication').execute();
}
