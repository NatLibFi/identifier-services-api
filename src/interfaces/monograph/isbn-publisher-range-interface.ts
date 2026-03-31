import HttpStatus from 'http-status';

import { ApiError } from '../../utils/api-error.ts';
import { getKysely } from '../../db/database.ts';
import { getCurrentTime } from '../interface-utils/common-interface-utils.ts';
import {
  canDeleteIsbnPublisherRange,
  generateIsbnIdentifierDbEntry,
  getIsbnIdentifiers,
} from './isbn-publisher-range-interface-utils.ts';
import { generateRangeArray } from '../../utils/generic-utils.ts';
import { rangeContainsIdentifier } from '../interface-utils/range-interface-utils.ts';

import type { CreateIsbnPublisherRangeHttp } from '../../validations/monograph/isbn-publisher-range-validation.ts';
import type { CreatedResponse } from '../interface-common-types.ts';
import type { RequestUser } from '../../generic-types.ts';

export async function createIsbnPublisherRange(
  isbnPublisherRanceCreateDoc: CreateIsbnPublisherRangeHttp,
  user: RequestUser,
): Promise<CreatedResponse> {
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

  if (!rangeContainsIdentifier(isbnRange, publisher_identifier)) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `ISBN range id ${isbn_range_id} does not contain publisher identifier of ${publisher_identifier}.`,
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
  const resultId = await db.transaction().execute(async (trx) => {
    const result = await trx
      .insertInto('isbn_publisher_range')
      .values({
        publisher_identifier,
        monograph_publisher_id,
        isbn_range_id,
        created: getCurrentTime(),
        created_by: user.id,
        modified: getCurrentTime(),
        modified_by: user.id,
      })
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

    return publisherRangeId;
  });

  return { id: resultId };
}

export async function deleteIsbnRange(isbnPublisherRangeId: number) {
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
    const publisherRangeResult = await trx
      .deleteFrom('isbn_publisher_range')
      .where('id', '=', isbnPublisherRangeId)
      .executeTakeFirstOrThrow();

    if (Number(publisherRangeResult.numDeletedRows) !== 1) {
      throw new Error('Only ISBN publisher range should have been deleted.');
    }

    await trx
      .deleteFrom('isbn_identifier')
      .where('isbn_publisher_range_id', '=', isbnPublisherRangeId)
      .executeTakeFirstOrThrow();

    // Verify removal of identifiers succeeded
    const { count } = await trx
      .selectFrom('isbn_identifier')
      .select(db.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();

    if (count !== 0) {
      throw new Error('ISBN identifiers associated with ISBN publisher range were not properly deleted.');
    }
  });

  return;
}
