import type { Generated, Updateable, Insertable, Selectable } from 'kysely';

export interface MonographPublication {
  id: Generated<number>;
  monograph_publisher_id: number | null;
  primary_title: string;
  created: Date;
  created_by: string;
  modified: Date;
  modified_by: string;
}

export type MonographPublicationInsert = Insertable<MonographPublication>;
export type MonographPublicationUpdate = Updateable<MonographPublication>;
export type MonographPublicationSelect = Selectable<MonographPublication>;
