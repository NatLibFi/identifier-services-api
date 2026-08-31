import type { Kysely } from 'kysely';
import type { Database } from '../../../db/types.ts';

export async function createSerialPublisherTable(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('serial_publisher')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement().notNull())
    .addColumn('official_name', 'varchar(100)', (col) => col.notNull())
    .addColumn('contact_persons', 'json', (col) => col.notNull())
    .addColumn('email_common', 'varchar(100)')
    .addColumn('phone', 'varchar(30)')
    .addColumn('address', 'varchar(50)')
    .addColumn('zip', 'varchar(10)')
    .addColumn('city', 'varchar(50)')
    .addColumn('lang_code', 'varchar(5)', (col) => col.notNull())
    .addColumn('additional_info', 'varchar(2000)')
    .addColumn('created', 'datetime', (col) => col.notNull())
    .addColumn('created_by', 'varchar(36)')
    .addColumn('modified', 'datetime', (col) => col.notNull())
    .addColumn('modified_by', 'varchar(36)')
    .execute();

  return;
}
