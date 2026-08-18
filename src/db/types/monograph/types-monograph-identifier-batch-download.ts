import type { Generated, Insertable, Selectable } from 'kysely';

export interface MonographIdentifierBatchDownload {
  id: Generated<number>;
  sha256sum: string;
  monograph_identifier_batch_id: number;
  created: Date;
}

export type MonographIdentifierBatchDownloadInsert = Insertable<MonographIdentifierBatchDownload>;
export type MonographIdentifierBatchDownloadSelect = Selectable<MonographIdentifierBatchDownload>;
