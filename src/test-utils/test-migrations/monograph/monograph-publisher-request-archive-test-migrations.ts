import type { Kysely } from 'kysely';
import type { Database } from '../../../db/types.ts';

// Table version: monograph publisher request v2.0.0-alpha.1
export async function createMonographPublisherRequestArchiveTable(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('monograph_publisher_request_archive')
    .addColumn('id', 'integer', (col) => col.primaryKey().notNull().autoIncrement())
    .addColumn('monograph_publisher_id', 'integer')
    .addColumn('monograph_publisher_request_id', 'integer')
    .addColumn('official_name', 'varchar(100)', (col) => col.notNull())
    .addColumn('other_names', 'json')
    .addColumn('address', 'varchar(100)')
    .addColumn('zip', 'varchar(10)')
    .addColumn('city', 'varchar(50)')
    .addColumn('phone', 'varchar(30)')
    .addColumn('email', 'varchar(100)')
    .addColumn('www', 'varchar(100)')
    .addColumn('lang_code', 'varchar(5)', (col) => col.notNull())
    .addColumn('contact_persons', 'json')
    .addColumn('frequency_current', 'varchar(50)')
    .addColumn('frequency_next', 'varchar(50)')
    .addColumn('affiliate_of', 'varchar(50)')
    .addColumn('affiliates', 'varchar(200)')
    .addColumn('distributor_of', 'varchar(200)')
    .addColumn('distributors', 'varchar(50)')
    .addColumn('classifications', 'json')
    .addColumn('classification_other', 'varchar(50)')
    .addColumn('created', 'datetime', (col) => col.notNull())
    .addColumn('created_by', 'varchar(30)', (col) => col.notNull())
    .execute();
}

export async function dropMonographPublisherRequestArchiveTable(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('monograph_publisher_request_archive').execute();
}
