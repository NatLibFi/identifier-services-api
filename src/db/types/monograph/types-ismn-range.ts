import type { Generated, Updateable, Insertable, Selectable } from 'kysely';

export interface IsmnRange {
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

export type IsmnRangeInsert = Insertable<IsmnRange>;
export type IsmnRangeUpdate = Updateable<IsmnRange>;
export type IsmnRangeSelect = Selectable<IsmnRange>;
