import type { Kysely } from 'kysely';
import type { Database } from '../../../db/types.ts';

export async function createSerialPublicationRequestTable(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('serial_publication_request')
    .addColumn('id', 'integer', (col) => col.primaryKey().notNull().autoIncrement())
    .addColumn('serial_publisher_id', 'integer')
    .addColumn('publisher_name', 'varchar(100)', (col) => col.notNull())
    .addColumn('status', 'varchar(12)', (col) => col.notNull())
    .addColumn('contact_person', 'varchar(100)')
    .addColumn('email', 'varchar(100)')
    .addColumn('phone', 'varchar(30)')
    .addColumn('address', 'varchar(100)')
    .addColumn('zip', 'varchar(10)')
    .addColumn('city', 'varchar(50)')
    .addColumn('lang_code', 'varchar(5)', (col) => col.notNull())
    .addColumn('created', 'datetime', (col) => col.notNull())
    .addColumn('created_by', 'varchar(36)', (col) => col.notNull())
    .addColumn('modified', 'datetime', (col) => col.notNull())
    .addColumn('modified_by', 'varchar(36)', (col) => col.notNull())
    .execute();
}

export async function dropSerialPublicationRequestTable(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('serial_publication_request').execute();
}
