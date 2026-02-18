import { getKysely } from '../../db/database.ts';
import type { IsbnRangeRead } from '../../db/types/monograph/types-isbn-range.ts';

interface IsbnRangeAdminResponse {
  id: number;
  gs1: string;
  registration_group: string;
  range_begin: string;
  range_end: string;
  active: boolean;
  // TODO: free
  created: string;
  created_by: string;
  modified: string;
  modified_by: string;
}

export async function getIsbnRanges() {
  const db = getKysely();
  // TODO: add dynamic "free" attribute
  const result = await db.selectFrom('isbn_range').selectAll().execute();
  return result.map(transformToResponse);

  function transformToResponse(isbnRangeResult: IsbnRangeRead): IsbnRangeAdminResponse {
    return {
      id: isbnRangeResult.id,
      gs1: isbnRangeResult.gs1,
      registration_group: isbnRangeResult.registration_group,
      range_begin: isbnRangeResult.range_begin,
      range_end: isbnRangeResult.range_end,
      active: isbnRangeResult.active,
      // TODO: free
      created: isbnRangeResult.created.toISOString(),
      created_by: isbnRangeResult.created_by,
      modified: isbnRangeResult.modified.toISOString(),
      modified_by: isbnRangeResult.modified_by,
    };
  }
}
