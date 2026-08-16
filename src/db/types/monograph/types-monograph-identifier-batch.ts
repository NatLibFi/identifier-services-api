import type { Generated, Insertable, Selectable } from 'kysely';

export interface MonographIdentifierBatch {
  id: Generated<number>;
  monograph_publisher_id: number;
  ismn_publisher_range_id: number | null;
  isbn_publisher_range_id: number | null;
  created: Date;
  created_by: string;
}

export type MonographIdentifierBatchInsert = Insertable<MonographIdentifierBatch>;
export type MonographIdentifierBatchSelect = Selectable<MonographIdentifierBatch>;
