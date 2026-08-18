import type {
  MonographIdentifierBatchSelectExtended,
  MonographIdentifierBatchSelect,
} from '../../db/types/monograph/types-monograph-identifier-batch.ts';

export function asMonographIdentifierBatchAdminRead(
  monographIdentifierBatch: MonographIdentifierBatchSelect,
  identifierCount: number,
): MonographIdentifierBatchSelectExtended {
  const { id, monograph_publisher_id, isbn_publisher_range_id, ismn_publisher_range_id, created, created_by } =
    monographIdentifierBatch;

  return {
    id,
    monograph_publisher_id,
    isbn_publisher_range_id,
    ismn_publisher_range_id,
    identifier_count: identifierCount,
    created,
    created_by,
  };
}
