import type { Generated, Updateable, Insertable, Selectable } from 'kysely';

export interface IssnRange {
  id: Generated<number>;
  block: string;
  range_begin: string;
  range_end: string;
  active: boolean;
  created: Date;
  created_by: string;
  modified: Date;
  modified_by: string;
}

export type IssnRangeInsert = Insertable<IssnRange>;
export type IssnRangeUpdate = Updateable<IssnRange>;
export type IssnRangeSelect = Selectable<IssnRange>;
