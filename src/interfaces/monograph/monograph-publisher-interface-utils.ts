import { getKysely } from '../../db/database.ts';

import {
  finnishIsbnPublisherStringStart,
  ismnPublisherIdentifierLikeString,
} from '../../validations/common-validation-regex.ts';

import { readMonographPublisher } from './monograph-publisher-interface.ts';

import type { IsbnPublisherRangeSelect } from '../../db/types/monograph/types-isbn-publisher-range.ts';
import type { RequestUser } from '../../generic-types.ts';
import type { IsmnPublisherRangeSelect } from '../../db/types/monograph/types-ismn-publisher-range.ts';
import type { MonographMessageSelect } from '../../db/types/monograph/types-monograph-message.ts';
import type { MonographPublicationRequestSelect } from '../../db/types/monograph/types-monograph-publication-request.ts';
import type { MonographPublicationSelect } from '../../db/types/monograph/types-monograph-publication.ts';

export async function getMonographPublisherIsbnRanges(
  monographPublisherId: number,
): Promise<IsbnPublisherRangeSelect[]> {
  const db = getKysely();
  return await db
    .selectFrom('isbn_publisher_range')
    .selectAll()
    .where('monograph_publisher_id', '=', monographPublisherId)
    .orderBy('id', 'desc')
    .execute();
}

export async function getMonographPublisherIsmnRanges(
  monographPublisherId: number,
): Promise<IsmnPublisherRangeSelect[]> {
  const db = getKysely();
  return await db
    .selectFrom('ismn_publisher_range')
    .selectAll()
    .where('monograph_publisher_id', '=', monographPublisherId)
    .orderBy('id', 'desc')
    .execute();
}

export async function getMonographPublisherMessages(monographPublisherId: number): Promise<MonographMessageSelect[]> {
  const db = getKysely();
  return await db
    .selectFrom('monograph_message')
    .selectAll()
    .where('monograph_publisher_id', '=', monographPublisherId)
    .orderBy('id', 'desc')
    .execute();
}

export async function getMonographPublisherPublicationRequests(
  monographPublisherId: number,
): Promise<MonographPublicationRequestSelect[]> {
  const db = getKysely();
  return await db
    .selectFrom('monograph_publication_request')
    .selectAll()
    .where('monograph_publisher_id', '=', monographPublisherId)
    .orderBy('id', 'desc')
    .execute();
}

export async function getMonographPublisherPublications(
  monographPublisherId: number,
): Promise<MonographPublicationSelect[]> {
  const db = getKysely();
  return await db
    .selectFrom('monograph_publication')
    .selectAll()
    .where('monograph_publisher_id', '=', monographPublisherId)
    .orderBy('id', 'desc')
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
  // If problems do occur split the query to two: one retrieving distinct result set and other count for total_doc

  // Process ISMN search
  if (useIsmnPublisherIdentifierSearch(searchString)) {
    const ismnPublisherRangeQuery = await db
      .selectFrom('ismn_publisher_range')
      .select('monograph_publisher_id')
      .distinct()
      .where('publisher_identifier', 'like', `${searchString}%`)
      .orderBy('monograph_publisher_id')
      .offset(offset)
      .limit(limit)
      .execute();

    const { total_doc } = await db
      .selectFrom('ismn_publisher_range')
      .select((eb) => eb.fn.count<number>('monograph_publisher_id').distinct().as('total_doc'))
      .where('publisher_identifier', 'like', `${searchString}%`)
      .orderBy('monograph_publisher_id')
      .executeTakeFirstOrThrow();

    // Utilize normal read with DTL to provide proper result for each user role
    const results = await Promise.all(
      ismnPublisherRangeQuery.map((r) => readMonographPublisher(r.monograph_publisher_id, user, true)),
    );

    return {
      total_doc,
      results,
    };
  }

  // Process ISBN search
  const isbnPublisherRangeQuery = await db
    .selectFrom('isbn_publisher_range')
    .select('monograph_publisher_id')
    .distinct()
    .where('publisher_identifier', 'like', `${searchString}%`)
    .orderBy('monograph_publisher_id')
    .offset(offset)
    .limit(limit)
    .execute();

  const { total_doc } = await db
    .selectFrom('isbn_publisher_range')
    .select((eb) => eb.fn.count<number>('monograph_publisher_id').distinct().as('total_doc'))
    .where('publisher_identifier', 'like', `${searchString}%`)
    .orderBy('monograph_publisher_id')
    .executeTakeFirstOrThrow();

  // Utilize normal read with DTL to provide proper result for each user role
  const results = await Promise.all(
    isbnPublisherRangeQuery.map((r) => readMonographPublisher(r.monograph_publisher_id, user, true)),
  );

  return {
    total_doc,
    results,
  };
}
