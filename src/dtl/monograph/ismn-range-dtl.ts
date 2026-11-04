import type { IsmnRangeSelect } from '../../db/types/monograph/types-ismn-range.ts';

export interface IsmnRangeAdminRead extends IsmnRangeSelect {
  available_publisher_ranges: string[];
}

export interface IsmnRangeAdminReadList extends IsmnRangeSelect {
  free: number;
  taken: number;
}

export function asIsmnRangeAdminReadList(
  ismnRange: IsmnRangeSelect,
  free: number,
  taken: number,
): IsmnRangeAdminReadList {
  const { id, gs1, registration_group, range_begin, range_end, active, created, created_by, modified, modified_by } =
    ismnRange;

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

export function asIsmnRangeAdminRead(
  ismnRange: IsmnRangeSelect,
  availablePublisherRanges: string[],
): IsmnRangeAdminRead {
  const { id, gs1, registration_group, range_begin, range_end, active, created, created_by, modified, modified_by } =
    ismnRange;

  return {
    id,
    gs1,
    registration_group,
    range_begin,
    range_end,
    active,
    available_publisher_ranges: availablePublisherRanges,
    created,
    created_by,
    modified,
    modified_by,
  };
}
