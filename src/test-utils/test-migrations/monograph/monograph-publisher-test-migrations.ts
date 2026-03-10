import type { Kysely } from 'kysely';
import type { Database } from '../../../db/types.ts';

// Table version: monograph publisher v2.0.0-alpha.1
export async function createMonographPublisherTable(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('monograph_publisher')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement().notNull())
    .addColumn('official_name', 'varchar(100)', (col) => col.notNull())
    .addColumn('other_names', 'json')
    .addColumn('previous_names', 'json')
    .addColumn('address', 'varchar(100)')
    .addColumn('zip', 'varchar(10)')
    .addColumn('city', 'varchar(50)')
    .addColumn('phone', 'varchar(30)')
    .addColumn('email', 'varchar(100)', (col) => col.notNull())
    .addColumn('www', 'varchar(100)')
    .addColumn('lang_code', 'varchar(5)', (col) => col.notNull())
    .addColumn('contact_persons', 'json')
    .addColumn('additional_information', 'varchar(2000)')
    .addColumn('year_quitted', 'smallint', (col) => col.unsigned())
    .addColumn('has_quitted', 'boolean')
    .addColumn('frequency_current', 'varchar(50)')
    .addColumn('frequency_next', 'varchar(50)')
    .addColumn('affiliate_of', 'varchar(50)')
    .addColumn('affiliates', 'varchar(200)')
    .addColumn('distributor_of', 'varchar(200)')
    .addColumn('distributors', 'varchar(50)')
    .addColumn('classifications', 'json')
    .addColumn('classification_other', 'varchar(50)')
    .addColumn('promote_sorting', 'boolean')
    .addColumn('created', 'datetime', (col) => col.notNull())
    .addColumn('created_by', 'varchar(36)')
    .addColumn('modified', 'datetime', (col) => col.notNull())
    .addColumn('modified_by', 'varchar(36)')
    .execute();
}

export async function dropMonographPublisherTable(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('monograph_publisher').execute();
}
