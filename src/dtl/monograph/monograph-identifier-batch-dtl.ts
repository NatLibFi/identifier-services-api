import type { MonographIdentifierBatchSelect } from '../../db/types/monograph/types-monograph-identifier-batch.ts';

export function asMonographIdentifierBatchAdminRead(
  monographIdentifierBatch: MonographIdentifierBatchSelect,
): MonographIdentifierBatchSelect {
  const { id, monograph_publisher_id, isbn_publisher_range_id, ismn_publisher_range_id, created, created_by } =
    monographIdentifierBatch;

  return {
    id,
    monograph_publisher_id,
    isbn_publisher_range_id,
    ismn_publisher_range_id,
    created,
    created_by,
  };
}
