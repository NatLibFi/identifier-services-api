import { getKysely } from '../../db/database.ts';

export async function getIsbnRanges() {
  const db = getKysely();
  return await db.selectFrom('isbn_range').selectAll().execute();
}
