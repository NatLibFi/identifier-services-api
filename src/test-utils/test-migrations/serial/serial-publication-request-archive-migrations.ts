import type { Kysely } from 'kysely';
import type { Database } from '../../../db/types.ts';

export async function createSerialPublicationRequestArchiveTable(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('serial_publication_request_archive')
    .addColumn('id', 'integer', (col) => col.primaryKey().notNull().autoIncrement())
    .addColumn('serial_publication_request_id', 'integer', (col) => col.notNull())
    .addColumn('publisher_name', 'varchar(100)', (col) => col.notNull())
    .addColumn('contact_person', 'varchar(100)')
    .addColumn('email', 'varchar(100)')
    .addColumn('phone', 'varchar(30)')
    .addColumn('address', 'varchar(100)')
    .addColumn('zip', 'varchar(10)')
    .addColumn('city', 'varchar(50)')
    .addColumn('lang_code', 'varchar(5)', (col) => col.notNull())
    .addColumn('created', 'datetime', (col) => col.notNull())
    .addColumn('created_by', 'varchar(36)', (col) => col.notNull())
    .execute();

  return;
}
