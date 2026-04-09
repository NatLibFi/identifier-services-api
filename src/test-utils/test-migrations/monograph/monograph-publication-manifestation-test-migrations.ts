import type { Kysely } from 'kysely';

import type { Database } from '../../../db/types.ts';

export async function createMonographPublicationManifestationTable(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('monograph_publication_manifestation')
    .addColumn('id', 'integer', (col) => col.primaryKey().notNull().autoIncrement())
    .addColumn('monograph_publication_expression_id', 'integer', (col) => col.notNull())
    .addColumn('monograph_publication_request_id', 'integer')
    .addColumn('manifestation_type', 'varchar(50)', (col) => col.notNull())
    .addColumn('manifestation_type_other', 'varchar(100)')
    .addColumn('manifestation_edition', 'varchar(2)')
    .addColumn('map_scale', 'varchar(50)')
    .addColumn('authors', 'json', (col) => col.notNull())
    .addColumn('publication_year', 'varchar(4)')
    .addColumn('publication_month', 'varchar(2)')
    .addColumn('series', 'json', (col) => col.notNull())
    .addColumn('printing_information', 'json', (col) => col.notNull())
    .addColumn('cancelled', 'boolean', (col) => col.notNull())
    .addColumn('created', 'datetime', (col) => col.notNull())
    .addColumn('created_by', 'varchar(36)', (col) => col.notNull())
    .addColumn('modified', 'datetime', (col) => col.notNull())
    .addColumn('modified_by', 'varchar(36)', (col) => col.notNull())
    .execute();
}

export async function dropMonographPublicationManifestationTable(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('monograph_publication_manifestation').execute();
}
