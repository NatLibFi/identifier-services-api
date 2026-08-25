import HttpStatus from 'http-status';
import { sql } from 'kysely';

import {
  ISBN_PUBLISHER_IDENTIFIER_CATEGORY_TO_LENGTH,
  ISMN_PUBLISHER_IDENTIFIER_CATEGORY_TO_LENGTH,
  MONOGRAPH_IDENTIFIERS,
} from '../../constants.ts';

import { ApiError } from '../../utils/api-error.ts';
import { getKysely } from '../../db/database.ts';
import { isAdmin } from '../../utils/permission-utils.ts';

import {
  constructJsonContainsSearch,
  getCurrentTime,
  removeUndefinedProperties,
  validateGetById,
} from '../shared-interface-utils.ts';
import {
  getMonographPublisherIsbnRanges,
  getMonographPublisherIsbnRangesLite,
  getMonographPublisherIsmnRanges,
  getMonographPublisherIsmnRangesLite,
  getMonographPublisherMessages,
  getMonographPublisherPublicationRequests,
  getMonographPublisherPublications,
  getJoinMsgSent,
  searchMonographPublisherWithRange,
  useIsbnPublisherIdentifierSearch,
  useIsmnPublisherIdentifierSearch,
} from './monograph-publisher-interface-utils.ts';

import {
  asMonographPublisherAdminRead,
  asMonographPublisherAdminSearchRead,
  asMonographPublisherArchiveEntry,
  asMonographPublisherAutocompleteRead,
  asMonographPublisherGuestRead,
} from '../../dtl/monograph/monograph-publisher-dtl.ts';

import type { RequestUser } from '../../generic-types.ts';
import type {
  MonographPublisherSelect,
  MonographPublisherUpdate,
} from '../../db/types/monograph/types-monograph-publisher.ts';
import type {
  SearchMonographPublisherHttp,
  UpdateMonographPublisherHttp,
} from '../../validations/monograph/monograph-publisher-validation.ts';
import type { MonographPublisherRequestArchiveSelect } from '../../db/types/monograph/types-monograph-publisher-request-archive.ts';

// useAdminLite -> reserved for searching using publisher identifier as this relies on using read for found entries
// Utility of not having dynamic attributes associated with DB schema models (e.g., publisher identifier and total/free/used)
// has cost of requiring these type complex optimizations within some functionalities
export async function readMonographPublisher(id: number, user?: RequestUser, useDtl = true, useAdminLite = false) {
  const db = getKysely();
  const dbResult = await db.selectFrom('monograph_publisher').selectAll().where('id', '=', id).execute();
  const monographPublisherResult = validateGetById<MonographPublisherSelect>(dbResult);

  // Disallow skipping DTL for other than admin users
  if (isAdmin(user) && !useDtl) {
    return monographPublisherResult;
  }

  if (isAdmin(user) && useAdminLite) {
    const isbnPublisherRanges = await getMonographPublisherIsbnRangesLite(id);
    const ismnPublisherRanges = await getMonographPublisherIsmnRangesLite(id);

    return asMonographPublisherAdminSearchRead(monographPublisherResult, isbnPublisherRanges, ismnPublisherRanges);
  } else if (isAdmin(user)) {
    const isbnPublisherRanges = await getMonographPublisherIsbnRanges(id);
    const ismnPublisherRanges = await getMonographPublisherIsmnRanges(id);
    const joinMsgSent = await getJoinMsgSent(id);

    return asMonographPublisherAdminRead(
      monographPublisherResult,
      isbnPublisherRanges,
      ismnPublisherRanges,
      joinMsgSent,
    );
  }

  const isbnPublisherRanges = await getMonographPublisherIsbnRangesLite(id);
  const ismnPublisherRanges = await getMonographPublisherIsmnRangesLite(id);

  return asMonographPublisherGuestRead(monographPublisherResult, isbnPublisherRanges, ismnPublisherRanges);
}

export async function deleteMonographPublisher(monographPublisherId: number) {
  const db = getKysely();

  // Read to confirm range exists - this will also take care of returning 404
  await readMonographPublisher(monographPublisherId);

  // If there are any associations (other than archive entry) deletion is not currently allowed through API
  const isbnPublisherRanges = await getMonographPublisherIsbnRangesLite(monographPublisherId);
  if (isbnPublisherRanges.length !== 0) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Monograph publisher id ${monographPublisherId} has ${isbnPublisherRanges.length} associated ISBN publisher ranges.`,
    );
  }

  const ismnPublisherRanges = await getMonographPublisherIsmnRangesLite(monographPublisherId);
  if (ismnPublisherRanges.length !== 0) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Monograph publisher id ${monographPublisherId} has ${ismnPublisherRanges.length} associated ISMN publisher ranges.`,
    );
  }

  const monographMessages = await getMonographPublisherMessages(monographPublisherId);
  if (monographMessages.length !== 0) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Monograph publisher id ${monographPublisherId} has ${monographMessages.length} associated messages.`,
    );
  }

  const monographPublicationRequests = await getMonographPublisherPublicationRequests(monographPublisherId);
  if (monographPublicationRequests.length !== 0) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Monograph publisher id ${monographPublisherId} has ${monographPublicationRequests.length} associated monograph publication requests.`,
    );
  }

  const monographPublications = await getMonographPublisherPublications(monographPublisherId);
  if (monographPublications.length !== 0) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Monograph publisher id ${monographPublisherId} has ${monographPublications.length} associated monograph publications.`,
    );
  }

  // Delete within transaction to simulatenously remove archive entry
  await db.transaction().execute(async (trx) => {
    // 1. Remove archive entry
    const archiveEntryDelete = await trx
      .deleteFrom('monograph_publisher_request_archive')
      .where('monograph_publisher_id', '=', monographPublisherId)
      .where('monograph_publisher_request_id', 'is', null)
      .executeTakeFirstOrThrow();

    if (Number(archiveEntryDelete.numDeletedRows) !== 1) {
      throw new Error(
        'Removal unexpectedly affected more or less than exactly one row in monograph_publisher_request_archive table',
      );
    }

    // 2. Remove entry from monograph publisher table
    const publisherDelete = await trx
      .deleteFrom('monograph_publisher')
      .where('id', '=', monographPublisherId)
      .executeTakeFirstOrThrow();

    if (Number(publisherDelete.numDeletedRows) !== 1) {
      throw new Error('Removal unexpectedly affected more or less than exactly one row in monograph_publisher table');
    }

    return;
  });

  return;
}

export async function updateMonographPublisher(
  id: number,
  monographPublisherUpdateDoc: UpdateMonographPublisherHttp,
  user: RequestUser,
) {
  const db = getKysely();

  // Read to confirm monograph publisher exists - this will also take care of returning 404
  await readMonographPublisher(id, user, false);

  // Update
  const {
    official_name,
    other_names,
    previous_names,
    address,
    zip,
    city,
    phone,
    email,
    www,
    lang_code,
    contact_persons,
    additional_info,
    year_quitted,
    has_quitted,
    frequency_current,
    frequency_next,
    affiliate_of,
    affiliates,
    distributor_of,
    distributors,
    classifications,
    classification_other,
    promote_sorting,
  } = monographPublisherUpdateDoc;

  const monographPublisherUpdateValues = {
    official_name,
    other_names: other_names ? JSON.stringify(other_names) : undefined,
    previous_names: previous_names ? JSON.stringify(previous_names) : undefined,
    address,
    zip,
    city,
    phone,
    email,
    www,
    lang_code,
    contact_persons: contact_persons ? JSON.stringify(contact_persons) : undefined,
    additional_info,
    year_quitted,
    has_quitted,
    frequency_current,
    frequency_next,
    affiliate_of,
    affiliates,
    distributor_of,
    distributors,
    classifications: classifications ? JSON.stringify(classifications) : undefined,
    classification_other,
    promote_sorting,
    modified: getCurrentTime(),
    modified_by: user.id,
  };

  const dbUpdateValues = removeUndefinedProperties<MonographPublisherUpdate>(monographPublisherUpdateValues);

  // Update within transaction to guarantee change of one row only
  await db.transaction().execute(async (trx) => {
    const { numChangedRows } = await trx
      .updateTable('monograph_publisher')
      .set(dbUpdateValues)
      .where('id', '=', id)
      .executeTakeFirstOrThrow();

    if (Number(numChangedRows) !== 1) {
      throw new Error('Update unexpectedly changed more than one row');
    }
  });

  // Use consistent return value between processing. This will be one additional read as overhead, but currently it's acceptable.
  return readMonographPublisher(id, user);
}

export async function searchMonographPublisher(searchParameters: SearchMonographPublisherHttp, user: RequestUser) {
  const { search_text, has_quitted, identifier_type, category, limit, offset } = searchParameters;

  const publisherIdentifierLength =
    identifier_type === MONOGRAPH_IDENTIFIERS.ISBN
      ? ISBN_PUBLISHER_IDENTIFIER_CATEGORY_TO_LENGTH[`${category}`]
      : ISMN_PUBLISHER_IDENTIFIER_CATEGORY_TO_LENGTH[`${category}`];

  // As of now certain filters are available only for administrator users
  if (!isAdmin(user) && (identifier_type || category)) {
    throw new ApiError(
      HttpStatus.FORBIDDEN,
      'Forbidden',
      `Identifier type and category filtering is only available for administrator users.`,
    );
  }

  const db = getKysely();

  let query = db.selectFrom('monograph_publisher');

  const onlyIsbn = identifier_type && identifier_type === MONOGRAPH_IDENTIFIERS.ISBN;
  const onlyIsmn = identifier_type && identifier_type === MONOGRAPH_IDENTIFIERS.ISMN;

  // Process search that targets ISBN publisher identifier as separate block
  if (search_text && useIsbnPublisherIdentifierSearch(search_text) && !onlyIsmn) {
    const result = await searchMonographPublisherWithRange(search_text, limit, offset, user);
    return result;
  }

  // Process search that targets ISBN publisher identifier as separate block
  if (search_text && useIsmnPublisherIdentifierSearch(search_text) && !onlyIsbn) {
    const result = await searchMonographPublisherWithRange(search_text, limit, offset, user);
    return result;
  }

  if (search_text) {
    const normalizedSearch = `%${search_text.trim()}%`.toLowerCase();

    query = query.where((eb) => {
      if (isAdmin(user)) {
        return eb.or([
          eb(eb.fn('lower', ['official_name']), 'like', normalizedSearch),
          eb(eb.fn('lower', ['email']), 'like', normalizedSearch),
          constructJsonContainsSearch(eb, 'other_names', normalizedSearch),
          constructJsonContainsSearch(eb, 'previous_names', normalizedSearch),
        ]);
      }

      return eb.or([
        eb(eb.fn('lower', ['official_name']), 'like', normalizedSearch),
        constructJsonContainsSearch(eb, 'other_names', normalizedSearch),
        constructJsonContainsSearch(eb, 'previous_names', normalizedSearch),
      ]);
    });
  }

  if (typeof has_quitted === 'boolean') {
    query = query.where('has_quitted', '=', has_quitted);
  }

  // Publisher identifier type filtering
  if (identifier_type === MONOGRAPH_IDENTIFIERS.ISBN && !publisherIdentifierLength) {
    query = query.where((eb) =>
      eb.exists(
        eb
          .selectFrom('isbn_publisher_range')
          .select('isbn_publisher_range.id')
          .whereRef('isbn_publisher_range.monograph_publisher_id', '=', 'monograph_publisher.id'),
      ),
    );
  }

  if (identifier_type === MONOGRAPH_IDENTIFIERS.ISBN && publisherIdentifierLength) {
    query = query.where((eb) =>
      eb.exists(
        eb
          .selectFrom('isbn_publisher_range')
          .select('isbn_publisher_range.id')
          .whereRef('isbn_publisher_range.monograph_publisher_id', '=', 'monograph_publisher.id')
          .where(sql<number>`length(isbn_publisher_range.publisher_identifier)`, '=', publisherIdentifierLength),
      ),
    );
  }

  if (identifier_type === MONOGRAPH_IDENTIFIERS.ISMN && !publisherIdentifierLength) {
    query = query.where((eb) =>
      eb.exists(
        eb
          .selectFrom('ismn_publisher_range')
          .select('ismn_publisher_range.id')
          .whereRef('ismn_publisher_range.monograph_publisher_id', '=', 'monograph_publisher.id'),
      ),
    );
  }

  if (identifier_type === MONOGRAPH_IDENTIFIERS.ISMN && publisherIdentifierLength) {
    query = query.where((eb) =>
      eb.exists(
        eb
          .selectFrom('ismn_publisher_range')
          .select('ismn_publisher_range.id')
          .whereRef('ismn_publisher_range.monograph_publisher_id', '=', 'monograph_publisher.id')
          .where(sql<number>`length(ismn_publisher_range.publisher_identifier)`, '=', publisherIdentifierLength),
      ),
    );
  }

  const countQuery = query.clearSelect().select((eb) => eb.fn.countAll().as('total_doc'));
  query = query.selectAll('monograph_publisher').orderBy('id', 'desc').limit(limit).offset(offset);

  // @ts-expect-error query builder does not understand typing here
  const result: MonographPublisherSelect[] = await query.execute();
  const { total_doc } = await countQuery.executeTakeFirstOrThrow();

  if (isAdmin(user)) {
    return {
      total_doc,
      results: await Promise.all(
        result.map(async (p) => {
          const isbnPublisherRanges = await getMonographPublisherIsbnRangesLite(p.id);
          const ismnPublisherRanges = await getMonographPublisherIsmnRangesLite(p.id);
          return asMonographPublisherAdminSearchRead(p, isbnPublisherRanges, ismnPublisherRanges);
        }),
      ),
    };
  }

  return {
    total_doc,
    results: await Promise.all(
      result.map(async (p) => {
        const isbnPublisherRanges = await getMonographPublisherIsbnRangesLite(p.id);
        const ismnPublisherRanges = await getMonographPublisherIsmnRangesLite(p.id);
        return asMonographPublisherGuestRead(p, isbnPublisherRanges, ismnPublisherRanges);
      }),
    ),
  };
}

export async function monographPublisherAutocomplete(search_text: string) {
  const db = getKysely();

  const normalizedSearch = `%${search_text}%`.toLowerCase();

  const query = db
    .selectFrom('monograph_publisher')
    .selectAll()
    .where((eb) => {
      return eb.or([
        eb(eb.fn('lower', ['official_name']), 'like', normalizedSearch),
        constructJsonContainsSearch(eb, 'other_names', normalizedSearch),
        constructJsonContainsSearch(eb, 'previous_names', normalizedSearch),
      ]);
    })
    .orderBy('promote_sorting', 'desc')
    .orderBy('official_name', 'asc')
    .limit(10)
    .offset(0);

  const result: MonographPublisherSelect[] = await query.execute();

  return result.map(asMonographPublisherAutocompleteRead);
}

export async function readMonographPublisherArchiveEntry(id: number) {
  const db = getKysely();
  const dbResult = await db
    .selectFrom('monograph_publisher_request_archive')
    .selectAll()
    .where('monograph_publisher_id', '=', id)
    .execute();
  const monographPublisherArchiveResult = validateGetById<MonographPublisherRequestArchiveSelect>(dbResult);

  return asMonographPublisherArchiveEntry(monographPublisherArchiveResult);
}
