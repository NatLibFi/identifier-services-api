import type { Generated, Updateable, Insertable, Selectable } from 'kysely';

export interface IsmnIdentifier {
  id: Generated<number>;
  identifier: string;
  ismn_publisher_range_id: number;
  monograph_publication_manifestation_id: number | null;
  monograph_identifier_batch_id: number | null;
  created: Date;
  created_by: string;
  modified: Date;
  modified_by: string;
}

export type IsmnIdentifierInsert = Insertable<IsmnIdentifier>;
export type IsmnIdentifierUpdate = Updateable<IsmnIdentifier>;
export type IsmnIdentifierSelect = Selectable<IsmnIdentifier>;
