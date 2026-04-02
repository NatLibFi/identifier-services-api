import type { IsbnRangeSelect } from '../../db/types/monograph/types-isbn-range.ts';

export interface IsbnRangeRead extends IsbnRangeSelect {
  available_publisher_ranges: string[];
}

export function asIsbnRangeAdminRead(isbnRange: IsbnRangeSelect): IsbnRangeSelect {
  const { id, gs1, registration_group, range_begin, range_end, active, created, created_by, modified, modified_by } =
    isbnRange;

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
