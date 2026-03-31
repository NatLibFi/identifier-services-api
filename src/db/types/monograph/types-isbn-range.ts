import type { Generated, Updateable, Insertable, Selectable } from 'kysely';

export interface IsbnRange {
  id: Generated<number>;
  gs1: string;
  registration_group: string;
  range_begin: string;
  range_end: string;
  active: boolean;
  created: Date;
  created_by: string;
  modified: Date;
  modified_by: string;
}

export type IsbnRangeInsert = Insertable<IsbnRange>;
export type IsbnRangeUpdate = Updateable<IsbnRange>;
export type IsbnRangeSelect = Selectable<IsbnRange>;
