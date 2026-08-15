import HttpStatus from 'http-status';

import { ApiError } from '../../utils/api-error.ts';
import { getKysely } from '../../db/database.ts';
import { getCurrentTime } from '../shared-interface-utils.ts';

import {
  canDeleteIsbnPublisherRange,
  generateIsbnIdentifierDbEntry,
  getIsbnIdentifiers,
  getNumberOfIsbnIdentifiers,
  isbnPublisherRangeContainsIdentifier,
} from './isbn-publisher-range-interface-utils.ts';
import { generateRangeArray } from '../../utils/generic-utils.ts';
import { getAvailableIsbnPublisherRanges } from './isbn-range-interface-utils.ts';

import type { CreateIsbnPublisherRangeHttp } from '../../validations/monograph/isbn-publisher-range-validation.ts';
import type { RequestUser } from '../../generic-types.ts';
import type {
  IsbnPublisherRangePublicInfo,
  IsbnPublisherRangeSelect,
} from '../../db/types/monograph/types-isbn-publisher-range.ts';
import { ISBN_PUBLISHER_IDENTIFIER_CATEGORY_TO_LENGTH } from '../../constants.ts';

interface IsbnPublisherRangeCreateResult {
  id: number;
  publisher_identifier: string;
  identifier_total: number;
  identifier_used: number | null;
  identifier_free: number | null;
  created: Date;
}

export async function createIsbnPublisherRange(
  isbnPublisherRanceCreateDoc: CreateIsbnPublisherRangeHttp,
  user: RequestUser,
): Promise<IsbnPublisherRangeCreateResult> {
  const { publisher_identifier, monograph_publisher_id, isbn_range_id } = isbnPublisherRanceCreateDoc;
  const db = getKysely();

  const isbnRange = await db.selectFrom('isbn_range').selectAll().where('id', '=', isbn_range_id).executeTakeFirst();
  if (!isbnRange) {
    throw new ApiError(
      HttpStatus.NOT_FOUND,
      'Not found',
      `Selected ISBN range id ${isbn_range_id} could not be found.`,
    );
  }

  if (!isbnPublisherRangeContainsIdentifier(isbnRange, publisher_identifier)) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `ISBN range id ${isbn_range_id} does not contain publisher identifier of ${publisher_identifier}.`,
    );
  }

  const availableIsbnRangePublisherRanges = await getAvailableIsbnPublisherRanges(isbnRange);
  const isAvailable = availableIsbnRangePublisherRanges.includes(publisher_identifier);
  const isLastAvailable = availableIsbnRangePublisherRanges.filter((v) => v !== publisher_identifier).length === 0;

  if (!isAvailable) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `ISBN range id ${isbn_range_id} available ISBN publisher ranges do not contain publisher identifier of ${publisher_identifier}.`,
    );
  }

  const monographPublisher = await db
    .selectFrom('monograph_publisher')
    .selectAll()
    .where('id', '=', monograph_publisher_id)
    .executeTakeFirst();

  if (!monographPublisher) {
    throw new ApiError(
      HttpStatus.NOT_FOUND,
      'Not found',
      `Selected monograph publisher id ${monograph_publisher_id} could not be found.`,
    );
  }

  if (monographPublisher.has_quitted) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Selected monograph publisher id ${monograph_publisher_id} has quitted and cannot be assigned ISBN publisher identifiers to.`,
    );
  }

  // Sanity check: publisher identifier does not exist in DB yet
  const existingIsbnPublisherRange = await db
    .selectFrom('isbn_publisher_range')
    .selectAll()
    .where('publisher_identifier', '=', publisher_identifier)
    .executeTakeFirst();

  if (existingIsbnPublisherRange !== undefined) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `ISBN publisher range ${publisher_identifier} has already been created and assigned to a monograph publisher.`,
    );
  }

  const associatedIsbnIdentifiers = getIsbnIdentifiers(publisher_identifier);

  // Processed within transaction to create ISBN identifiers associated with the ISBN publisher range in batches of 1k
  const result: IsbnPublisherRangeCreateResult = await db.transaction().execute(async (trx) => {
    // When last ISBN publisher range is assigned, deactivate range
    if (isLastAvailable) {
      await trx
        .updateTable('isbn_range')
        .set({
          active: false,
          modified_by: user.id,
          modified: getCurrentTime(),
        })
        .where('id', '=', isbn_range_id)
        .executeTakeFirstOrThrow();
    }

    const isbnPublisherRangeData = {
      publisher_identifier,
      monograph_publisher_id,
      isbn_range_id,
      created: getCurrentTime(),
      created_by: user.id,
      modified: getCurrentTime(),
      modified_by: user.id,
    };

    const result = await trx
      .insertInto('isbn_publisher_range')
      .values(isbnPublisherRangeData)
      .executeTakeFirstOrThrow();

    const publisherRangeId = Number(result.insertId);
    const numBatches = Math.ceil(associatedIsbnIdentifiers.length / 1000);

    await Promise.all(
      generateRangeArray(numBatches).map(async (batchIdx) => {
        const batchStart = 1000 * batchIdx;
        const batchMaxEnd = batchStart + 1000;
        const batchEnd =
          associatedIsbnIdentifiers.length >= batchMaxEnd ? batchMaxEnd : associatedIsbnIdentifiers.length;

        const batchIdentifiers = associatedIsbnIdentifiers.slice(batchStart, batchEnd);
        const batchDbEntries = batchIdentifiers.map((identifier) =>
          generateIsbnIdentifierDbEntry(identifier, publisherRangeId),
        );

        await trx.insertInto('isbn_identifier').values(batchDbEntries).execute();
      }),
    );

    return {
      id: publisherRangeId,
      publisher_identifier: isbnPublisherRangeData.publisher_identifier,
      identifier_total: associatedIsbnIdentifiers.length,
      identifier_used: 0,
      identifier_free: associatedIsbnIdentifiers.length,
      created: isbnPublisherRangeData.created,
    };
  });

  // Remove used and free from non category 5 isbn publisher ranges
  if (publisher_identifier.length !== ISBN_PUBLISHER_IDENTIFIER_CATEGORY_TO_LENGTH[5]) {
    result.identifier_used = null;
    result.identifier_free = null;
  }

  return result;
}

export async function readIsbnPublisherRange(isbnPublisherRangeId: number): Promise<IsbnPublisherRangeSelect> {
  const db = getKysely();

  const isbnPublisherRange = await db
    .selectFrom('isbn_publisher_range')
    .selectAll()
    .where('id', '=', isbnPublisherRangeId)
    .executeTakeFirst();

  if (!isbnPublisherRange) {
    throw new ApiError(
      HttpStatus.NOT_FOUND,
      'Not found',
      `ISBN publisher range id ${isbnPublisherRangeId} could not be found.`,
    );
  }

  return isbnPublisherRange;
}

export async function readIsbnPublisherRangePublicInfo(
  isbnPublisherRangeId: number,
): Promise<IsbnPublisherRangePublicInfo> {
  const db = getKysely();

  const result = await db
    .selectFrom('isbn_publisher_range')
    .leftJoin('monograph_publisher', 'monograph_publisher.id', 'isbn_publisher_range.monograph_publisher_id')
    .select([
      'isbn_publisher_range.publisher_identifier as publisher_identifier',
      'monograph_publisher.official_name as publisher_name',
    ])
    .where('isbn_publisher_range.id', '=', isbnPublisherRangeId)
    .execute();

  const [responseEntry] = result;
  if (result.length !== 1 || !responseEntry) {
    throw new ApiError(
      HttpStatus.NOT_FOUND,
      'Not found',
      `ISBN publisher range id ${isbnPublisherRangeId} could not be found.`,
    );
  }

  const { publisher_identifier, publisher_name } = responseEntry;
  if (!publisher_identifier || !publisher_name) {
    throw new ApiError(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Unprocessable entity',
      `ISBN publisher range id ${isbnPublisherRangeId} information was not available.`,
    );
  }

  return {
    publisher_identifier,
    publisher_name,
  };
}

export async function deleteIsbnPublisherRange(isbnPublisherRangeId: number) {
  const db = getKysely();

  const isbnPublisherRange = await readIsbnPublisherRange(isbnPublisherRangeId);

  const allowRangeDeletion = await canDeleteIsbnPublisherRange(isbnPublisherRange);
  if (allowRangeDeletion.result === false) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `ISBN publisher range id ${isbnPublisherRangeId} cannot be deleted due to an constraint: ${allowRangeDeletion.reason}`,
    );
  }

  // Remove all associated identifiers in same transaction where the ISBN publisher identifier is removed
  await db.transaction().execute(async (trx) => {
    const isbnIdentifierResult = await trx
      .deleteFrom('isbn_identifier')
      .where('isbn_publisher_range_id', '=', isbnPublisherRangeId)
      .executeTakeFirstOrThrow();

    // Verify removal of identifiers succeeded
    const expectedIdentifierDeleteCount = getNumberOfIsbnIdentifiers(isbnPublisherRange);

    if (Number(isbnIdentifierResult.numDeletedRows) !== expectedIdentifierDeleteCount) {
      throw new Error(
        `ISBN identifiers associated with ISBN publisher range were not properly deleted (count after delete was ${Number(isbnIdentifierResult.numDeletedRows)}).`,
      );
    }

    const publisherRangeResult = await trx
      .deleteFrom('isbn_publisher_range')
      .where('id', '=', isbnPublisherRangeId)
      .executeTakeFirstOrThrow();

    if (Number(publisherRangeResult.numDeletedRows) !== 1) {
      throw new Error('Only ISBN publisher range should have been deleted.');
    }
  });

  return;
}
