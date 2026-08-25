import HttpStatus from 'http-status';

import { getKysely } from '../../db/database.ts';

import {
  finnishIsbnPublisherStringStart,
  ismnPublisherIdentifierLikeString,
} from '../../validations/common-validation-regex.ts';

import { readMonographPublisher } from './monograph-publisher-interface.ts';

import { ApiError } from '../../utils/api-error.ts';
import { MONOGRAPH_MESSAGE_TYPES } from '../../constants.ts';

import type {
  IsbnPublisherRangeSelect,
  IsbnPublisherRangeSelectLite,
} from '../../db/types/monograph/types-isbn-publisher-range.ts';
import type { RequestUser } from '../../generic-types.ts';
import type {
  IsmnPublisherRangeSelect,
  IsmnPublisherRangeSelectLite,
} from '../../db/types/monograph/types-ismn-publisher-range.ts';
import type { MonographMessageSelect } from '../../db/types/monograph/types-monograph-message.ts';
import type { MonographPublicationRequestSelect } from '../../db/types/monograph/types-monograph-publication-request.ts';
import type { MonographPublicationSelect } from '../../db/types/monograph/types-monograph-publication.ts';
import type { MonographIdentifierBatchSelectExtended } from '../../db/types/monograph/types-monograph-identifier-batch.ts';

export interface IsbnPublisherRangeSelectExtended extends IsbnPublisherRangeSelect {
  monograph_identifier_batches: MonographIdentifierBatchSelectExtended[];
  identifier_total: number;
  identifier_used: number;
  identifier_free: number;
}

export interface IsmnPublisherRangeSelectExtended extends IsmnPublisherRangeSelect {
  monograph_identifier_batches: MonographIdentifierBatchSelectExtended[];
  identifier_total: number;
  identifier_used: number;
  identifier_free: number;
}

// Lite version does not utilize correlated subquery to increase performance
export async function getMonographPublisherIsbnRangesLite(
  monographPublisherId: number,
): Promise<IsbnPublisherRangeSelectLite[]> {
  const db = getKysely();

  return await db
    .selectFrom('isbn_publisher_range')
    .select(['id', 'publisher_identifier'])
    .where('monograph_publisher_id', '=', monographPublisherId)
    .orderBy('id', 'desc')
    .execute();
}

// Detailed version uses correlated subquery to determine values for attributes previoustly stored into DB (free, total, used)
// IMPORTANT NOTE: these calculated variables consider information for publications stored in database. It does not cases for any
// publisher that manages their identifiers in separate systems (category 1-4 ISBN publisher ranges)
export async function getMonographPublisherIsbnRanges(
  monographPublisherId: number,
): Promise<IsbnPublisherRangeSelectExtended[]> {
  const db = getKysely();

  const result = await db
    .selectFrom('isbn_publisher_range as ipr')
    .selectAll('ipr')
    .select((eb) => [
      eb
        .selectFrom('isbn_identifier as ii')
        .select(eb.fn.countAll<number>().as('identifier_count'))
        .whereRef('ii.isbn_publisher_range_id', '=', 'ipr.id')
        .as('identifier_total'),
      eb
        .selectFrom('isbn_identifier as ii')
        .select(eb.fn.countAll<number>().as('identifier_used'))
        .whereRef('ii.isbn_publisher_range_id', '=', 'ipr.id')
        .where((eb) =>
          eb.or([
            eb('ii.monograph_publication_manifestation_id', 'is not', null),
            eb('ii.monograph_identifier_batch_id', 'is not', null), // Just for verification, category 5 ISBN publisher ranges should not EVER have batches
          ]),
        )
        .as('identifier_used'),
    ])
    .where('monograph_publisher_id', '=', monographPublisherId)
    .orderBy('id', 'desc')
    .execute();

  // Early return as future queries will otherwise fail because of 'in' used together with empty array
  if (result.length === 0) {
    return [];
  }

  const invalidResult = result.find((r) => r.identifier_total === null || r.identifier_used === null);
  if (invalidResult) {
    throw new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Internal server error',
      `ISBN publisher range ${invalidResult.publisher_identifier} identifier count has a problem in database. Please notify system administrators.`,
    );
  }

  const isbnPublisherRangeIds = result.map((r) => r.id);
  const identifierBatches = await db
    .selectFrom('monograph_identifier_batch')
    .selectAll()
    .select((eb) => [
      eb
        .selectFrom('isbn_identifier')
        .select(eb.fn.countAll<number>().as('identifier_count'))
        .whereRef('isbn_identifier.monograph_identifier_batch_id', '=', 'monograph_identifier_batch.id')
        .as('identifier_count'),
    ])
    .where('isbn_publisher_range_id', 'in', isbnPublisherRangeIds)
    .execute();

  if (identifierBatches.some((b) => b.identifier_count === null)) {
    throw new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Internal server error',
      `Problem with identifier batches observed in database. Please notify system administrators.`,
    );
  }

  // @ts-expect-error TS cannot understand value has been validated
  return result.map((r) => ({
    ...r,
    // @ts-expect-error TS cannot understand value has been validated
    identifier_free: r.identifier_total - r.identifier_used,
    monograph_identifier_batches: identifierBatches.filter((b) => b.isbn_publisher_range_id === r.id),
  }));
}

// Lite version does not utilize correlated subquery to increase performance
export async function getMonographPublisherIsmnRangesLite(
  monographPublisherId: number,
): Promise<IsmnPublisherRangeSelectLite[]> {
  const db = getKysely();
  return await db
    .selectFrom('ismn_publisher_range')
    .select(['id', 'publisher_identifier'])
    .where('monograph_publisher_id', '=', monographPublisherId)
    .orderBy('id', 'desc')
    .execute();
}

// Detailed version uses correlated subquery to determine values for attributes previoustly stored into DB (free, total, used)
// IMPORTANT NOTE: these calculated variables consider information for publications stored in database. It does not cases for any
// publisher that manages their identifiers in separate systems (category 3-6 ISMN publisher ranges)
export async function getMonographPublisherIsmnRanges(
  monographPublisherId: number,
): Promise<IsmnPublisherRangeSelectExtended[]> {
  const db = getKysely();
  const result = await db
    .selectFrom('ismn_publisher_range as ipr')
    .selectAll('ipr')
    .select((eb) => [
      eb
        .selectFrom('ismn_identifier as ii')
        .select(eb.fn.countAll<number>().as('identifier_count'))
        .whereRef('ii.ismn_publisher_range_id', '=', 'ipr.id')
        .as('identifier_total'),
      eb
        .selectFrom('ismn_identifier as ii')
        .select(eb.fn.countAll<number>().as('identifier_used'))
        .whereRef('ii.ismn_publisher_range_id', '=', 'ipr.id')
        .where((eb) =>
          eb.or([
            eb('ii.monograph_publication_manifestation_id', 'is not', null),
            eb('ii.monograph_identifier_batch_id', 'is not', null), // Just for verification, category 7 ISMN publisher ranges should not EVER have batches
          ]),
        )
        .as('identifier_used'),
    ])
    .where('monograph_publisher_id', '=', monographPublisherId)
    .orderBy('id', 'desc')
    .execute();

  // Early return as future queries will otherwise fail because of 'in' used together with empty array
  if (result.length === 0) {
    return [];
  }

  const invalidResult = result.find((r) => r.identifier_total === null || r.identifier_used === null);
  if (invalidResult) {
    throw new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Internal server error',
      `ISMN publisher range ${invalidResult.publisher_identifier} identifier count has a problem in database. Please notify system administrators.`,
    );
  }

  const ismnPublisherRangeIds = result.map((r) => r.id);
  const identifierBatches = await db
    .selectFrom('monograph_identifier_batch')
    .selectAll()
    .select((eb) => [
      eb
        .selectFrom('ismn_identifier')
        .select(eb.fn.countAll<number>().as('identifier_count'))
        .whereRef('ismn_identifier.monograph_identifier_batch_id', '=', 'monograph_identifier_batch.id')
        .as('identifier_count'),
    ])
    .where('ismn_publisher_range_id', 'in', ismnPublisherRangeIds)
    .execute();

  if (identifierBatches.some((b) => b.identifier_count === null)) {
    throw new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Internal server error',
      `Problem with identifier batches observed in database. Please notify system administrators.`,
    );
  }

  // @ts-expect-error TS cannot understand value has been validated
  return result.map((r) => ({
    ...r,
    // @ts-expect-error TS cannot understand value has been validated
    identifier_free: r.identifier_total - r.identifier_used,
    monograph_identifier_batches: identifierBatches.filter((b) => b.ismn_publisher_range_id === r.id),
  }));
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
      ismnPublisherRangeQuery.map((r) => readMonographPublisher(r.monograph_publisher_id, user, true, true)),
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
    isbnPublisherRangeQuery.map((r) => readMonographPublisher(r.monograph_publisher_id, user, true, true)),
  );

  return {
    total_doc,
    results,
  };
}

export async function getJoinMsgSent(publisherId: number) {
  const db = await getKysely();

  const isbnResult = await db
    .selectFrom('monograph_message')
    .select('id')
    .where('message_type', '=', MONOGRAPH_MESSAGE_TYPES.ISBN_PUBLISHER_REGISTRY_JOIN_CONFIRMATION)
    .where('monograph_publisher_id', '=', publisherId)
    .limit(1)
    .executeTakeFirst();

  const ismnResult = await db
    .selectFrom('monograph_message')
    .select('id')
    .where('message_type', '=', MONOGRAPH_MESSAGE_TYPES.ISMN_PUBLISHER_REGISTRY_JOIN_CONFIRMATION)
    .where('monograph_publisher_id', '=', publisherId)
    .limit(1)
    .executeTakeFirst();

  return {
    isbnJoinMsgSent: isbnResult !== undefined,
    ismnJoinMsgSent: ismnResult !== undefined,
  };
}
