import type { Kysely } from 'kysely';

import type { Database } from '../../../db/types.ts';

export async function createMonographPublicationExpressionTable(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('monograph_publication_expression')
    .addColumn('id', 'integer', (col) => col.primaryKey().notNull().autoIncrement())
    .addColumn('monograph_publication_id', 'integer', (col) => col.notNull())
    .addColumn('expression_type', 'varchar(15)', (col) => col.notNull())
    .addColumn('expression_language', 'varchar(3)', (col) => col.notNull())
    .addColumn('authors', 'json', (col) => col.notNull())
    .addColumn('title', 'varchar(200)', (col) => col.notNull())
    .addColumn('subtitle', 'varchar(200)')
    .addColumn('map_scale', 'varchar(50)')
    .addColumn('created', 'datetime', (col) => col.notNull())
    .addColumn('created_by', 'varchar(36)', (col) => col.notNull())
    .addColumn('modified', 'datetime', (col) => col.notNull())
    .addColumn('modified_by', 'varchar(36)', (col) => col.notNull())
    .execute();
}

export async function dropMonographPublicationExpressionTable(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('monograph_publication_expression').execute();
}
