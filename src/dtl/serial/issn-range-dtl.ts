import type { IssnRangeSelect } from '../../db/types/serial/types-issn-range.ts';

export interface IssnRangeRead extends IssnRangeSelect {
  taken: number;
  total: number;
  free: number;
}

export function asIssnRangeAdminRead(
  issnRange: IssnRangeSelect,
  takenIdentifierCount: number,
  totalIdentifiersCount: number,
): IssnRangeRead {
  const { id, block, range_begin, range_end, active, created, created_by, modified, modified_by } = issnRange;

  return {
    id,
    block,
    range_begin,
    range_end,
    active,
    taken: takenIdentifierCount,
    total: totalIdentifiersCount,
    free: totalIdentifiersCount - takenIdentifierCount,
    created,
    created_by,
    modified,
    modified_by,
  };
}
