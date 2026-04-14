import type { Kysely } from 'kysely';
import type { Database } from '../../../db/types.ts';

export async function createMonographPublicationRequestTable(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('monograph_publication_request')
    .addColumn('id', 'integer', (col) => col.primaryKey().notNull().autoIncrement())
    .addColumn('monograph_publisher_id', 'integer')
    .addColumn('monograph_publication_id', 'integer')
    .addColumn('official_name', 'varchar(100)', (col) => col.notNull())
    .addColumn('publisher_identifier_str', 'varchar(20)')
    .addColumn('locality', 'varchar(50)')
    .addColumn('address', 'varchar(100)')
    .addColumn('zip', 'varchar(10)')
    .addColumn('city', 'varchar(50)')
    .addColumn('phone', 'varchar(30)')
    .addColumn('email', 'varchar(100)')
    .addColumn('lang_code', 'varchar(5)', (col) => col.notNull())
    .addColumn('contact_person', 'varchar(100)')
    .addColumn('published_before', 'boolean', (col) => col.notNull())
    .addColumn('publishing_activity', 'varchar(10)')
    .addColumn('publishing_activity_amount', 'varchar(5)')
    .addColumn('publications_intra', 'boolean', (col) => col.notNull())
    .addColumn('publications_public', 'boolean', (col) => col.notNull())
    .addColumn('comments', 'varchar(2000)')
    .addColumn('request_state', 'varchar(20)', (col) => col.notNull())
    .addColumn('created', 'datetime', (col) => col.notNull())
    .addColumn('created_by', 'varchar(36)', (col) => col.notNull())
    .addColumn('modified', 'datetime', (col) => col.notNull())
    .addColumn('modified_by', 'varchar(36)', (col) => col.notNull())
    .execute();
}

export async function dropMonographPublicationRequestTable(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('monograph_publication_request').execute();
}
