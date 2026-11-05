import HttpStatus from 'http-status';

import { ApiError } from '../../utils/api-error.ts';
import { getCurrentTime, validateRowsDeleted, validateRowsUpdatedExact } from '../shared-interface-utils.ts';
import { getBatchIsbnIdentifierIds } from './isbn-identifier-utils.ts';
import { getIsbnPublisherRangeCategory, getNumberOfIsbnIdentifiers } from './isbn-publisher-range-interface-utils.ts';
import { getBatchIsmnIdentifierIds } from './ismn-identifier-utils.ts';
import { getIsmnPublisherRangeCategory, getNumberOfIsmnIdentifiers } from './ismn-publisher-range-interface-utils.ts';

import { getKysely } from '../../db/database.ts';
import { readIsbnPublisherRange } from './isbn-publisher-range-interface.ts';
import { readIsmnPublisherRange } from './ismn-publisher-range-interface.ts';

import type { IsbnIdentifierSelect } from '../../db/types/monograph/types-isbn-identifier.ts';
import type { IsmnIdentifierSelect } from '../../db/types/monograph/types-ismn-identifier.ts';
import type {
  MonographIdentifierBatchSelectExtended,
  MonographIdentifierBatchSelect,
} from '../../db/types/monograph/types-monograph-identifier-batch.ts';
import type { RequestUser } from '../../generic-types.ts';
import type { Transaction } from 'kysely';
import type { Database } from '../../db/types.ts';

export async function createIsbnIdentifierBatch(
  isbnPublisherRangeId: number,
  identifierCount: number,
  user: RequestUser,
): Promise<MonographIdentifierBatchSelectExtended> {
  const db = getKysely();
  const isbnPublisherRange = await readIsbnPublisherRange(isbnPublisherRangeId);

  // Guard: batches are not available for category 5 ISBN publisher ranges
  // as these identifiers are managed within the system by administrators
  const category = getIsbnPublisherRangeCategory(isbnPublisherRange.publisher_identifier);
  if (category > 4) {
    throw new ApiError(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Unprocessable entity',
      'Cannot generate batch for category 5 ISBN publisher range (only available for category 1-4).',
    );
  }

  let identifierIds: number[] = [];

  // Do operation within transaction
  const result = await db.transaction().execute(async (trx) => {
    const currentTime = getCurrentTime();

    try {
      identifierIds = await getBatchIsbnIdentifierIds(isbnPublisherRangeId, identifierCount, trx);
    } catch (error) {
      if (error instanceof Error && error.cause === 'Inadequate number of identifiers') {
        throw new ApiError(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Unprocessable entity',
          `${identifierCount} ISBN identifiers cannot be provided from ISBN publisher range id ${isbnPublisherRangeId} (${isbnPublisherRange.publisher_identifier}).`,
        );
      }

      throw new ApiError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
        'Unknown error occurred during attempting to gather ISBN identifiers for the batch',
      );
    }

    const batchDbEntry = {
      monograph_publisher_id: isbnPublisherRange.monograph_publisher_id,
      isbn_publisher_range_id: isbnPublisherRange.id,
      ismn_publisher_range_id: null,
      created: currentTime,
      created_by: user.id,
    };

    const batchResult = await trx
      .insertInto('monograph_identifier_batch')
      .values(batchDbEntry)
      .executeTakeFirstOrThrow();
    const batchId = Number(batchResult.insertId);

    // Assign identifiers
    const identifierUpdateResult = await trx
      .updateTable('isbn_identifier')
      .set({ monograph_identifier_batch_id: batchId, modified: currentTime, modified_by: user.id })
      .where('id', 'in', identifierIds)
      .executeTakeFirstOrThrow();

    const numRowsAffected = Number(identifierUpdateResult.numUpdatedRows);

    if (numRowsAffected !== identifierCount) {
      throw new ApiError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
        `Problem in assigning identifiers: asked for ${identifierCount} ISBN identifiers and DB query was only able to provide ${numRowsAffected}`,
      );
    }

    return { id: batchId, ...batchDbEntry, identifier_count: numRowsAffected };
  });

  return result;
}

export async function createIsmnIdentifierBatch(
  ismnPublisherRangeId: number,
  identifierCount: number,
  user: RequestUser,
): Promise<MonographIdentifierBatchSelectExtended> {
  const db = getKysely();
  const ismnPublisherRange = await readIsmnPublisherRange(ismnPublisherRangeId);

  // Guard: batches are not available for category 7 ISMN publisher ranges
  // as these identifiers are managed within the system by administrators
  const category = getIsmnPublisherRangeCategory(ismnPublisherRange.publisher_identifier);
  if (category > 6) {
    throw new ApiError(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Unprocessable entity',
      'Cannot generate batch for category 7 ISMN publisher range (only available for category 3-6).',
    );
  }

  let identifierIds: number[] = [];

  // Do operation within transaction
  const result = await db.transaction().execute(async (trx) => {
    try {
      identifierIds = await getBatchIsmnIdentifierIds(ismnPublisherRangeId, identifierCount, trx);
    } catch (error) {
      if (error instanceof Error && error.cause === 'Inadequate number of identifiers') {
        throw new ApiError(
          HttpStatus.UNPROCESSABLE_ENTITY,
          'Unprocessable entity',
          `${identifierCount} ISMN identifiers cannot be provided from ISMN publisher range id ${ismnPublisherRangeId} (${ismnPublisherRange.publisher_identifier}).`,
        );
      }

      throw new ApiError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
        'Unknown error occurred during attempting to gather ISMN identifiers for the batch',
      );
    }

    const batchDbEntry = {
      monograph_publisher_id: ismnPublisherRange.monograph_publisher_id,
      isbn_publisher_range_id: null,
      ismn_publisher_range_id: ismnPublisherRange.id,
      created: getCurrentTime(),
      created_by: user.id,
    };

    const batchResult = await trx
      .insertInto('monograph_identifier_batch')
      .values(batchDbEntry)
      .executeTakeFirstOrThrow();

    const batchId = Number(batchResult.insertId);

    // Assign identifiers
    const identifierUpdateResult = await trx
      .updateTable('ismn_identifier')
      .set({ monograph_identifier_batch_id: batchId, modified: getCurrentTime(), modified_by: user.id })
      .where('id', 'in', identifierIds)
      .executeTakeFirstOrThrow();

    const numRowsAffected = Number(identifierUpdateResult.numUpdatedRows);

    if (numRowsAffected !== identifierCount) {
      throw new ApiError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
        `Problem in assigning identifiers: asked for ${identifierCount} ISMN identifiers and DB query was only able to provide ${numRowsAffected}`,
      );
    }

    return { id: batchId, ...batchDbEntry, identifier_count: numRowsAffected };
  });

  return result;
}

export async function identifierBatchHasMessages(batchId: number, trx: Transaction<Database>) {
  const { message_count } = await trx
    .selectFrom('monograph_message')
    .select(trx.fn.countAll<number>().as('message_count'))
    .where('monograph_identifier_batch_id', '=', batchId)
    .forUpdate()
    .executeTakeFirstOrThrow();

  return message_count !== 0;
}

export async function identifierBatchHasDownloads(batchId: number, trx: Transaction<Database>) {
  const { download_count } = await trx
    .selectFrom('monograph_identifier_batch_download')
    .select(trx.fn.countAll<number>().as('download_count'))
    .where('monograph_identifier_batch_id', '=', batchId)
    .forUpdate()
    .executeTakeFirstOrThrow();

  return download_count !== 0;
}

export async function identifierBatchHasPublisherPublicationAssignations(batchId: number, trx: Transaction<Database>) {
  const { isbn_assigned_count } = await trx
    .selectFrom('isbn_identifier')
    .select(trx.fn.countAll<number>().as('isbn_assigned_count'))
    .where('monograph_identifier_batch_id', '=', batchId)
    .where('monograph_publication_manifestation_id', 'is not', null)
    .forUpdate()
    .executeTakeFirstOrThrow();

  const { ismn_assigned_count } = await trx
    .selectFrom('ismn_identifier')
    .select(trx.fn.countAll<number>().as('ismn_assigned_count'))
    .where('monograph_identifier_batch_id', '=', batchId)
    .where('monograph_publication_manifestation_id', 'is not', null)
    .forUpdate()
    .executeTakeFirstOrThrow();

  return isbn_assigned_count > 0 || ismn_assigned_count > 0;
}

export async function deleteIdentifierBatch(
  identifierBatch: MonographIdentifierBatchSelectExtended,
  user: RequestUser,
  trx: Transaction<Database>,
): Promise<void> {
  // Fetch associated publisher identifier: this is used to determine validation check for affected identifier rows
  // This is done outside of existing transaction which is fine for this case
  let publisherRangeIdentifierCount: number;

  if (identifierBatch.isbn_publisher_range_id) {
    const isbnPublisherRange = await readIsbnPublisherRange(identifierBatch.isbn_publisher_range_id);
    publisherRangeIdentifierCount = getNumberOfIsbnIdentifiers(isbnPublisherRange);
  } else if (identifierBatch.ismn_publisher_range_id) {
    const ismnPublisherRange = await readIsmnPublisherRange(identifierBatch.ismn_publisher_range_id);
    publisherRangeIdentifierCount = getNumberOfIsmnIdentifiers(ismnPublisherRange);
  } else {
    throw new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Internal server error',
      'Identifier batch data has been corrupted. Please contact system administrator.',
    );
  }

  // Handle altering ISBN identifiers
  if (identifierBatch.isbn_publisher_range_id) {
    const identifierUpdateResult = await trx
      .updateTable('isbn_identifier')
      .set({ monograph_identifier_batch_id: null, modified: getCurrentTime(), modified_by: user.id })
      .where('monograph_identifier_batch_id', '=', identifierBatch.id)
      .executeTakeFirstOrThrow();

    const numChangedIdentifiers = Number(identifierUpdateResult.numUpdatedRows);

    // Sanity check: number of changed identifiers cannot exceed maximum number of identifiers for the publisher range
    if (numChangedIdentifiers > publisherRangeIdentifierCount) {
      throw new ApiError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
        `DB query would have resulted to changing ${numChangedIdentifiers} ISBN identifiers and ISBN publisher range id ${identifierBatch.isbn_publisher_range_id} only may contain maximum of ${publisherRangeIdentifierCount} identifiers.`,
      );
    }

    // Final verification against the original batch read
    validateRowsUpdatedExact(identifierUpdateResult, identifierBatch.identifier_count);
  } else if (identifierBatch.ismn_publisher_range_id) {
    // Handle altering ISMN identifiers
    const identifierUpdateResult = await trx
      .updateTable('ismn_identifier')
      .set({ monograph_identifier_batch_id: null, modified: getCurrentTime(), modified_by: user.id })
      .where('monograph_identifier_batch_id', '=', identifierBatch.id)
      .executeTakeFirstOrThrow();

    const numChangedIdentifiers = Number(identifierUpdateResult.numUpdatedRows);

    // Sanity check: number of changed identifiers cannot exceed maximum number of identifiers for the publisher range
    if (numChangedIdentifiers > publisherRangeIdentifierCount) {
      throw new ApiError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
        `DB query would have resulted to changing ${numChangedIdentifiers} ISMN identifiers and ISMN publisher range id ${identifierBatch.ismn_publisher_range_id} only may contain maximum of ${publisherRangeIdentifierCount} identifiers.`,
      );
    }

    // Final verification against the original batch read
    validateRowsUpdatedExact(identifierUpdateResult, identifierBatch.identifier_count);
  }

  // Finally remove the batch itself
  const deleteResult = await trx
    .deleteFrom('monograph_identifier_batch')
    .where('id', '=', identifierBatch.id)
    .executeTakeFirstOrThrow();

  validateRowsDeleted(deleteResult, 1);

  return;
}

export async function getBatchIdentifierCount(identifierBatch: MonographIdentifierBatchSelect): Promise<number> {
  const db = getKysely();

  let identifierCount: number;

  if (identifierBatch.isbn_publisher_range_id && !identifierBatch.ismn_publisher_range_id) {
    const { identifier_count } = await db
      .selectFrom('isbn_identifier')
      .select(db.fn.countAll<number>().as('identifier_count'))
      .where('monograph_identifier_batch_id', '=', identifierBatch.id)
      .executeTakeFirstOrThrow();

    identifierCount = identifier_count;
  } else if (identifierBatch.ismn_publisher_range_id && !identifierBatch.isbn_publisher_range_id) {
    const { identifier_count } = await db
      .selectFrom('ismn_identifier')
      .select(db.fn.countAll<number>().as('identifier_count'))
      .where('monograph_identifier_batch_id', '=', identifierBatch.id)
      .executeTakeFirstOrThrow();

    identifierCount = identifier_count;
  } else if (identifierBatch.isbn_publisher_range_id && identifierBatch.ismn_publisher_range_id) {
    throw new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Internal server error',
      'Data corrupted: both ISBN and ISMN publisher range association were defined',
    );
  } else {
    throw new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Internal server error',
      'Data corrupted: missing publisher range association',
    );
  }

  return identifierCount;
}

export async function getIdentifierBatchIdentifiers(
  identifierBatch: MonographIdentifierBatchSelectExtended,
): Promise<IsbnIdentifierSelect[] | IsmnIdentifierSelect[]> {
  const db = getKysely();

  let identifiers: IsbnIdentifierSelect[] | IsmnIdentifierSelect[] = [];

  if (identifierBatch.isbn_publisher_range_id && !identifierBatch.ismn_publisher_range_id) {
    identifiers = await db
      .selectFrom('isbn_identifier')
      .selectAll()
      .where('monograph_identifier_batch_id', '=', identifierBatch.id)
      .where('isbn_publisher_range_id', '=', identifierBatch.isbn_publisher_range_id)
      .execute();
  } else if (identifierBatch.ismn_publisher_range_id && !identifierBatch.isbn_publisher_range_id) {
    identifiers = await db
      .selectFrom('ismn_identifier')
      .selectAll()
      .where('monograph_identifier_batch_id', '=', identifierBatch.id)
      .where('ismn_publisher_range_id', '=', identifierBatch.ismn_publisher_range_id)
      .execute();
  } else {
    throw new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Internal server error',
      'Data corrupted: both ISBN and ISMN publisher range association were defined',
    );
  }

  return identifiers;
}
