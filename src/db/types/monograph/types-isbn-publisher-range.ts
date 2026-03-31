import type { Generated, Updateable, Insertable, Selectable } from 'kysely';

export interface IsbnPublisherRange {
  id: Generated<number>;
  publisher_identifier: string;
  monograph_publisher_id: number;
  isbn_range_id: number;
  created: Date;
  created_by: string;
  modified: Date;
  modified_by: string;
}

export type IsbnPublisherRangeInsert = Insertable<IsbnPublisherRange>;
export type IsbnPublisherRangeUpdate = Updateable<IsbnPublisherRange>;
export type IsbnPublisherRangeSelect = Selectable<IsbnPublisherRange>;
