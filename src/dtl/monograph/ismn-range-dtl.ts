import type { IsmnRangeSelect } from '../../db/types/monograph/types-ismn-range.ts';

export interface IsmnRangeRead extends IsmnRangeSelect {
  available_publisher_ranges: string[];
}

export function asIsmnRangeAdminRead(ismnRange: IsmnRangeSelect): IsmnRangeSelect {
  const { id, gs1, registration_group, range_begin, range_end, active, created, created_by, modified, modified_by } =
    ismnRange;

  return {
    id,
    gs1,
    registration_group,
    range_begin,
    range_end,
    active,
    created,
    created_by,
    modified,
    modified_by,
  };
}
