import { getKysely } from '../../db/database.ts';

import type { IsbnPublisherRangeSelect } from '../../db/types/monograph/types-isbn-publisher-range.ts';

export async function getMonographPublisherIsbnRanges(
  monographPublisherId: number,
): Promise<IsbnPublisherRangeSelect[]> {
  const db = getKysely();
  return await db
    .selectFrom('isbn_publisher_range')
    .selectAll()
    .where('monograph_publisher_id', '=', monographPublisherId)
    .execute();
}
