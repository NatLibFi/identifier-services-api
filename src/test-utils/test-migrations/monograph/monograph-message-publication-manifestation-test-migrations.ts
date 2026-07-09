import type { Kysely } from 'kysely';
import type { Database } from '../../../db/types.ts';

export async function createMonographMessagePublicationManifestationTable(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('monograph_message_publication_manifestation')
    .addColumn('id', 'integer', (col) => col.primaryKey().notNull().autoIncrement())
    .addColumn('monograph_message_id', 'integer', (col) => col.notNull())
    .addColumn('monograph_publication_manifestation_id', 'integer', (col) => col.notNull())
    .execute();
}

export async function dropMonographMessagePublicationManifestationTable(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('monograph_message_publication_manifestation').execute();
}
