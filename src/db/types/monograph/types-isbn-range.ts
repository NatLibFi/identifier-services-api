import type { Generated } from 'kysely';

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

// TODO: insertable, selectable, and updateable types
export interface IsbnRangeRead extends Omit<IsbnRange, 'id'> {
  id: number;
}
