import type { Generated, Updateable, Insertable, Selectable } from 'kysely';

export interface MonographMessagePublicationManifestation {
  id: Generated<number>;
  monograph_message_id: number;
  monograph_publication_manifestation_id: number;
}

export type MonographMessagePublicationManifestationInsert = Insertable<MonographMessagePublicationManifestation>;
export type MonographMessagePublicationManifestationUpdate = Updateable<MonographMessagePublicationManifestation>;
export type MonographMessagePublicationManifestationSelect = Selectable<MonographMessagePublicationManifestation>;
