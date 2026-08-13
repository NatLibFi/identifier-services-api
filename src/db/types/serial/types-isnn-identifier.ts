import type { Generated, Updateable, Insertable, Selectable } from 'kysely';

export interface IssnIdentifier {
  id: Generated<number>;
  issn_range_id: number;
  serial_publication_id: number | null;
  identifier: string;
  frozen: boolean;
  created: Date;
  created_by: string;
  modified: Date;
  modified_by: string;
}

export type IssnIdentifierInsert = Insertable<IssnIdentifier>;
export type IssnIdentifierUpdate = Updateable<IssnIdentifier>;
export type IssnIdentifierSelect = Selectable<IssnIdentifier>;
