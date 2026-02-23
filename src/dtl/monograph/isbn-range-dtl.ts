import type { IsbnRangeRead } from '../../db/types/monograph/types-isbn-range.ts';

export function asIsbnRangeAdminRead(isbnRange: IsbnRangeRead): IsbnRangeRead {
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
