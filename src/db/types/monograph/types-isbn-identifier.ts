import type { Generated, Updateable, Insertable, Selectable } from 'kysely';

export interface IsbnIdentifier {
  id: Generated<number>;
  identifier: string;
  isbn_publisher_range_id: number;
  monograph_publication_manifestation_id: number | null;
  canceled: boolean;
  created: Date;
  created_by: string;
  modified: Date;
  modified_by: string;
}

export type IsbnIdentifierInsert = Insertable<IsbnIdentifier>;
export type IsbnIdentifierUpdate = Updateable<IsbnIdentifier>;
export type IsbnIdentifierSelect = Selectable<IsbnIdentifier>;
