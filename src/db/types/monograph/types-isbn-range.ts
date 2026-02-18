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

// Read types are done to satisfy instances where Generated<number> cannot be applied
export interface IsbnRangeRead {
  id: number;
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
