import type { Kysely } from 'kysely';
import type { Database } from '../../../db/types.ts';

export async function createMonographPublicationTable(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('monograph_publication')
    .addColumn('id', 'integer', (col) => col.primaryKey().notNull().autoIncrement())
    .addColumn('monograph_publisher_id', 'integer')
    .addColumn('primary_title', 'varchar(200)', (col) => col.notNull())
    .addColumn('created', 'datetime', (col) => col.notNull())
    .addColumn('created_by', 'varchar(36)', (col) => col.notNull())
    .addColumn('modified', 'datetime', (col) => col.notNull())
    .addColumn('modified_by', 'varchar(36)', (col) => col.notNull())
    .execute();
}

export async function dropMonographPublicationTable(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('monograph_publication').execute();
}
