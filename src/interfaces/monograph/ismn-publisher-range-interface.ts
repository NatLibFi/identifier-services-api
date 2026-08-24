import HttpStatus from 'http-status';

import { ApiError } from '../../utils/api-error.ts';
import { getKysely } from '../../db/database.ts';
import { getCurrentTime } from '../shared-interface-utils.ts';

import {
  canDeleteIsmnPublisherRange,
  generateIsmnIdentifierDbEntry,
  getIsmnIdentifiers,
  getNumberOfIsmnIdentifiers,
  ismnPublisherRangeContainsIdentifier,
} from './ismn-publisher-range-interface-utils.ts';
import { generateRangeArray } from '../../utils/generic-utils.ts';
import { getAvailableIsmnPublisherRanges } from './ismn-range-interface-utils.ts';

import type { CreateIsmnPublisherRangeHttp } from '../../validations/monograph/ismn-publisher-range-validation.ts';
import type { RequestUser } from '../../generic-types.ts';
import type {
  IsmnPublisherRangePublicInfo,
  IsmnPublisherRangeSelect,
} from '../../db/types/monograph/types-ismn-publisher-range.ts';
import type { MonographIdentifierBatchSelectExtended } from '../../db/types/monograph/types-monograph-identifier-batch.ts';

interface IsmnPublisherRangeCreateResult {
  id: number;
  publisher_identifier: string;
  identifier_total: number;
  identifier_used: number | null;
  identifier_free: number | null;
  monograph_identifier_batches: MonographIdentifierBatchSelectExtended[];
  created: Date;
}

export async function createIsmnPublisherRange(
  ismnPublisherRanceCreateDoc: CreateIsmnPublisherRangeHttp,
  user: RequestUser,
): Promise<IsmnPublisherRangeCreateResult> {
  const { publisher_identifier, monograph_publisher_id, ismn_range_id } = ismnPublisherRanceCreateDoc;
  const db = getKysely();

  const ismnRange = await db.selectFrom('ismn_range').selectAll().where('id', '=', ismn_range_id).executeTakeFirst();
  if (!ismnRange) {
    throw new ApiError(
      HttpStatus.NOT_FOUND,
      'Not found',
      `Selected ISMN range id ${ismn_range_id} could not be found.`,
    );
  }

  if (!ismnPublisherRangeContainsIdentifier(ismnRange, publisher_identifier)) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `ISMN range id ${ismn_range_id} does not contain publisher identifier of ${publisher_identifier}.`,
    );
  }

  const availableIsmnRangePublisherRanges = await getAvailableIsmnPublisherRanges(ismnRange);
  const isAvailable = availableIsmnRangePublisherRanges.includes(publisher_identifier);
  const isLastAvailable = availableIsmnRangePublisherRanges.filter((v) => v !== publisher_identifier).length === 0;

  if (!isAvailable) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `ISMN range id ${ismn_range_id} available ISMN publisher ranges do not contain publisher identifier of ${publisher_identifier}.`,
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
      `Selected monograph publisher id ${monograph_publisher_id} has quitted and cannot be assigned ISMN publisher identifiers to.`,
    );
  }

  // Sanity check ISMN publisher identifier is not found from DB
  const existingIsmnPublisherRange = await db
    .selectFrom('ismn_publisher_range')
    .selectAll()
    .where('publisher_identifier', '=', publisher_identifier)
    .executeTakeFirst();

  if (existingIsmnPublisherRange !== undefined) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `ISMN publisher range ${publisher_identifier} has already been created and assigned to a monograph publisher.`,
    );
  }

  const associatedIsmnIdentifiers = getIsmnIdentifiers(publisher_identifier);

  // Processed within transaction to create ISMN identifiers associated with the ISMN publisher range in batches of 1k
  const result: IsmnPublisherRangeCreateResult = await db.transaction().execute(async (trx) => {
    // When last ISMN publisher range is assigned, deactivate range
    if (isLastAvailable) {
      await trx
        .updateTable('ismn_range')
        .set({
          active: false,
          modified_by: user.id,
          modified: getCurrentTime(),
        })
        .where('id', '=', ismn_range_id)
        .executeTakeFirstOrThrow();
    }

    const ismnPublisherRangeData = {
      publisher_identifier,
      monograph_publisher_id,
      ismn_range_id,
      created: getCurrentTime(),
      created_by: user.id,
      modified: getCurrentTime(),
      modified_by: user.id,
    };

    const result = await trx
      .insertInto('ismn_publisher_range')
      .values(ismnPublisherRangeData)
      .executeTakeFirstOrThrow();

    const publisherRangeId = Number(result.insertId);
    const numBatches = Math.ceil(associatedIsmnIdentifiers.length / 1000);

    await Promise.all(
      generateRangeArray(numBatches).map(async (batchIdx) => {
        const batchStart = 1000 * batchIdx;
        const batchMaxEnd = batchStart + 1000;
        const batchEnd =
          associatedIsmnIdentifiers.length >= batchMaxEnd ? batchMaxEnd : associatedIsmnIdentifiers.length;

        const batchIdentifiers = associatedIsmnIdentifiers.slice(batchStart, batchEnd);
        const batchDbEntries = batchIdentifiers.map((identifier) =>
          generateIsmnIdentifierDbEntry(identifier, publisherRangeId),
        );

        await trx.insertInto('ismn_identifier').values(batchDbEntries).execute();
      }),
    );

    return {
      id: publisherRangeId,
      publisher_identifier: ismnPublisherRangeData.publisher_identifier,
      identifier_total: associatedIsmnIdentifiers.length,
      identifier_used: 0,
      identifier_free: associatedIsmnIdentifiers.length,
      monograph_identifier_batches: [],
      created: ismnPublisherRangeData.created,
    };
  });

  return result;
}

export async function readIsmnPublisherRange(ismnPublisherRangeId: number): Promise<IsmnPublisherRangeSelect> {
  const db = getKysely();

  const ismnPublisherRange = await db
    .selectFrom('ismn_publisher_range')
    .selectAll()
    .where('id', '=', ismnPublisherRangeId)
    .executeTakeFirst();

  if (!ismnPublisherRange) {
    throw new ApiError(
      HttpStatus.NOT_FOUND,
      'Not found',
      `ISMN publisher range id ${ismnPublisherRangeId} could not be found.`,
    );
  }

  return ismnPublisherRange;
}

export async function readIsmnPublisherRangePublicInfo(
  ismnPublisherRangeId: number,
): Promise<IsmnPublisherRangePublicInfo> {
  const db = getKysely();

  const result = await db
    .selectFrom('ismn_publisher_range')
    .leftJoin('monograph_publisher', 'monograph_publisher.id', 'ismn_publisher_range.monograph_publisher_id')
    .select([
      'ismn_publisher_range.publisher_identifier as publisher_identifier',
      'monograph_publisher.official_name as publisher_name',
    ])
    .where('ismn_publisher_range.id', '=', ismnPublisherRangeId)
    .execute();

  const [responseEntry] = result;
  if (result.length !== 1 || !responseEntry) {
    throw new ApiError(
      HttpStatus.NOT_FOUND,
      'Not found',
      `ISMN publisher range id ${ismnPublisherRangeId} could not be found.`,
    );
  }

  const { publisher_identifier, publisher_name } = responseEntry;
  if (!publisher_identifier || !publisher_name) {
    throw new ApiError(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Unprocessable entity',
      `ISMN publisher range id ${ismnPublisherRangeId} information was not available.`,
    );
  }

  return {
    publisher_identifier,
    publisher_name,
  };
}

export async function deleteIsmnPublisherRange(ismnPublisherRangeId: number) {
  const db = getKysely();

  const ismnPublisherRange = await readIsmnPublisherRange(ismnPublisherRangeId);

  const allowRangeDeletion = await canDeleteIsmnPublisherRange(ismnPublisherRange);
  if (allowRangeDeletion.result === false) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `ISMN publisher range id ${ismnPublisherRangeId} cannot be deleted due to an constraint: ${allowRangeDeletion.reason}`,
    );
  }

  // Remove all associated identifiers in same transaction where the ISMN publisher identifier is removed
  await db.transaction().execute(async (trx) => {
    const ismnIdentifierResult = await trx
      .deleteFrom('ismn_identifier')
      .where('ismn_publisher_range_id', '=', ismnPublisherRangeId)
      .executeTakeFirstOrThrow();

    // Verify removal of identifiers succeeded
    const expectedIdentifierDeleteCount = getNumberOfIsmnIdentifiers(ismnPublisherRange);

    if (Number(ismnIdentifierResult.numDeletedRows) !== expectedIdentifierDeleteCount) {
      throw new Error(
        `ISMN identifiers associated with ISMN publisher range were not properly deleted (count after delete was ${Number(ismnIdentifierResult.numDeletedRows)}).`,
      );
    }

    const publisherRangeResult = await trx
      .deleteFrom('ismn_publisher_range')
      .where('id', '=', ismnPublisherRangeId)
      .executeTakeFirstOrThrow();

    if (Number(publisherRangeResult.numDeletedRows) !== 1) {
      throw new Error('Only ISMN publisher range should have been deleted.');
    }
  });

  return;
}
