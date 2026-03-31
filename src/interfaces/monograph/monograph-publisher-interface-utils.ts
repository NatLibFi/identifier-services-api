import { getKysely } from '../../db/database.ts';

import {
  asMonographPublisherAdminRead,
  asMonographPublisherGuestRead,
} from '../../dtl/monograph/monograph-publisher-dtl.ts';
import { isAdmin } from '../../utils/permission-utils.ts';
import {
  finnishIsbnPublisherStringStart,
  ismnPublisherIdentifierLikeString,
} from '../../validations/common-validation-regex.ts';

import type { IsbnPublisherRangeSelect } from '../../db/types/monograph/types-isbn-publisher-range.ts';
import type { RequestUser } from '../../generic-types.ts';

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

export function useIsbnPublisherIdentifierSearch(searchString: string | undefined) {
  if (!searchString) {
    return false;
  }

  return searchString.match(finnishIsbnPublisherStringStart);
}

export function useIsmnPublisherIdentifierSearch(searchString: string | undefined) {
  if (!searchString) {
    return false;
  }

  return searchString.match(ismnPublisherIdentifierLikeString);
}

export async function searchMonographPublisherWithRange(
  searchString: string,
  limit: number,
  offset: number,
  user: RequestUser,
) {
  const db = getKysely();

  // Currently decided on processing with API server instead of introducing multiple DB queries
  // If problems do occur split the query to two: one retrieving distinct result set and other count for totalDoc
  const isbnPublisherRanges = await db
    .selectFrom('isbn_publisher_range')
    .select('monograph_publisher_id')
    .where('publisher_identifier', 'like', `${searchString}%`)
    .execute();

  const totalDoc = isbnPublisherRanges.length;
  const distinctPublisherIds = isbnPublisherRanges.reduce(
    (p: number[], n) => (p.includes(n.monograph_publisher_id) ? p : p.concat(n.monograph_publisher_id)),
    [],
  );

  // Order for consistency
  distinctPublisherIds.sort();
  const limitedDistinctPublisherIds = distinctPublisherIds.slice(offset, offset + limit);

  const result = await db
    .selectFrom('monograph_publisher')
    .selectAll()
    .where('id', 'in', limitedDistinctPublisherIds)
    .execute();

  // Return value is dependent on user role
  const resultDtl = isAdmin(user)
    ? result.map(asMonographPublisherAdminRead)
    : result.map(asMonographPublisherGuestRead);

  return {
    totalDoc,
    results: resultDtl,
  };
}
