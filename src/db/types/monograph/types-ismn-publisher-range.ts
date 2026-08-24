import type { Generated, Updateable, Insertable, Selectable } from 'kysely';

export interface IsmnPublisherRange {
  id: Generated<number>;
  publisher_identifier: string;
  monograph_publisher_id: number;
  ismn_range_id: number;
  created: Date;
  created_by: string;
  modified: Date;
  modified_by: string;
}

export interface IsmnPublisherRangePublicInfo {
  publisher_name: string;
  publisher_identifier: string;
}

export type IsmnPublisherRangeInsert = Insertable<IsmnPublisherRange>;
export type IsmnPublisherRangeUpdate = Updateable<IsmnPublisherRange>;
export type IsmnPublisherRangeSelect = Selectable<IsmnPublisherRange>;

export interface IsmnPublisherRangeSelectLite {
  id: number;
  publisher_identifier: string;
}
