import type { IsbnRangeSelect } from '../../db/types/monograph/types-isbn-range.ts';

export interface IsbnRangeAdminRead extends IsbnRangeSelect {
  available_publisher_ranges: string[];
}

export interface IsbnRangeAdminReadList extends IsbnRangeSelect {
  free: number;
  taken: number;
}

export function asIsbnRangeAdminReadList(
  isbnRange: IsbnRangeSelect,
  free: number,
  taken: number,
): IsbnRangeAdminReadList {
  const { id, gs1, registration_group, range_begin, range_end, active, created, created_by, modified, modified_by } =
    isbnRange;

  return {
    id,
    gs1,
    registration_group,
    range_begin,
    range_end,
    active,
    free,
    taken,
    created,
    created_by,
    modified,
    modified_by,
  };
}

export function asIsbnRangeAdminRead(
  isbnRange: IsbnRangeSelect,
  available_publisher_ranges: string[],
): IsbnRangeAdminRead {
  const { id, gs1, registration_group, range_begin, range_end, active, created, created_by, modified, modified_by } =
    isbnRange;

  return {
    id,
    gs1,
    registration_group,
    range_begin,
    range_end,
    active,
    available_publisher_ranges,
    created,
    created_by,
    modified,
    modified_by,
  };
}
