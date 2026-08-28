import HttpStatus from 'http-status';

import { ApiError } from '../../utils/api-error.ts';
import { getKysely } from '../../db/database.ts';

import { readIsbnPublisherRange } from './isbn-publisher-range-interface.ts';

import { getCurrentTime, validateRowsDeleted, validateRowsUpdatedExact } from '../shared-interface-utils.ts';
import { getBatchIsbnIdentifiers } from './isbn-identifier-utils.ts';
import { getBatchIsmnIdentifiers } from './ismn-identifier-utils.ts';

import { readIsmnPublisherRange } from './ismn-publisher-range-interface.ts';
import { getIsbnPublisherRangeCategory, getNumberOfIsbnIdentifiers } from './isbn-publisher-range-interface-utils.ts';
import { getIsmnPublisherRangeCategory, getNumberOfIsmnIdentifiers } from './ismn-publisher-range-interface-utils.ts';

import type {
  MonographIdentifierBatchSelectExtended,
  MonographIdentifierBatchSelect,
} from '../../db/types/monograph/types-monograph-identifier-batch.ts';
import type { RequestUser } from '../../generic-types.ts';
import type { IsbnIdentifierSelect } from '../../db/types/monograph/types-isbn-identifier.ts';
import type { IsmnIdentifierSelect } from '../../db/types/monograph/types-ismn-identifier.ts';

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
      'Cannot generate batch for category 5 ISBN publisher range (only available for category 4 and above).',
    );
  }

  let identifierIds: number[] = [];

  try {
    identifierIds = await getBatchIsbnIdentifiers(isbnPublisherRangeId, identifierCount);
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

  // Do operation within transaction
  const result = await db.transaction().execute(async (trx) => {
    const batchDbEntry = {
      monograph_publisher_id: isbnPublisherRange.monograph_publisher_id,
      isbn_publisher_range_id: isbnPublisherRange.id,
      ismn_publisher_range_id: null,
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
      .updateTable('isbn_identifier')
      .set({ monograph_identifier_batch_id: batchId, modified: getCurrentTime(), modified_by: user.id })
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
      'Cannot generate batch for category 7 ISMN publisher range (only available for category 6 and above).',
    );
  }

  let identifierIds: number[] = [];

  try {
    identifierIds = await getBatchIsmnIdentifiers(ismnPublisherRangeId, identifierCount);
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
      'Unknown error occurred during attempting to gather ISBN identifiers for the batch',
    );
  }

  // Do operation within transaction
  const result = await db.transaction().execute(async (trx) => {
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

export async function identifierBatchHasMessages(batchId: number) {
  const db = getKysely();
  const { message_count } = await db
    .selectFrom('monograph_message')
    .select(db.fn.countAll<number>().as('message_count'))
    .where('monograph_identifier_batch_id', '=', batchId)
    .executeTakeFirstOrThrow();

  return message_count !== 0;
}

export async function identifierBatchHasDownloads(batchId: number) {
  const db = getKysely();
  const { download_count } = await db
    .selectFrom('monograph_identifier_batch_download')
    .select(db.fn.countAll<number>().as('download_count'))
    .where('monograph_identifier_batch_id', '=', batchId)
    .executeTakeFirstOrThrow();

  return download_count !== 0;
}

export async function identifierBatchHasPublisherPublicationAssignations(batchId: number) {
  const db = getKysely();
  const { isbn_assigned_count } = await db
    .selectFrom('isbn_identifier')
    .select(db.fn.countAll<number>().as('isbn_assigned_count'))
    .where('monograph_identifier_batch_id', '=', batchId)
    .where('monograph_publication_manifestation_id', 'is not', null)
    .executeTakeFirstOrThrow();

  const { ismn_assigned_count } = await db
    .selectFrom('ismn_identifier')
    .select(db.fn.countAll<number>().as('ismn_assigned_count'))
    .where('monograph_identifier_batch_id', '=', batchId)
    .where('monograph_publication_manifestation_id', 'is not', null)
    .executeTakeFirstOrThrow();

  return isbn_assigned_count > 0 || ismn_assigned_count > 0;
}

export async function deleteIdentifierBatch(
  identifierBatch: MonographIdentifierBatchSelectExtended,
  user: RequestUser,
): Promise<void> {
  const db = getKysely();

  // Fetch associated publisher identifier: this is used to determine validation check for affected identifier rows
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

  // Make changes within transaction
  await db.transaction().execute(async (trx) => {
    // Handle altering ISBN identifiers
    if (identifierBatch.isbn_publisher_range_id) {
      const identifierUpdateResult = await trx
        .updateTable('isbn_identifier')
        .set({ monograph_identifier_batch_id: null, modified: getCurrentTime(), modified_by: user.id })
        .where('monograph_identifier_batch_id', '=', identifierBatch.id)
        .executeTakeFirstOrThrow();

      const numChangedIdentifiers = Number(identifierUpdateResult.numChangedRows);

      // Sanity check: number of changed identifiers cannot exceed maximum number of identifiers for the publisher range
      if (numChangedIdentifiers > publisherRangeIdentifierCount) {
        throw new ApiError(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'Internal server error',
          `DB query would have resulted to changing ${numChangedIdentifiers} ISBN identifiers and ISBN publisher range id ${identifierBatch.isbn_publisher_range_id} only may contain maximum of ${publisherRangeIdentifierCount} identifiers.`,
        );
      }
    } else if (identifierBatch.ismn_publisher_range_id) {
      // Handle altering ISMN identifiers
      const identifierUpdateResult = await trx
        .updateTable('ismn_identifier')
        .set({ monograph_identifier_batch_id: null, modified: getCurrentTime(), modified_by: user.id })
        .where('monograph_identifier_batch_id', '=', identifierBatch.id)
        .executeTakeFirstOrThrow();

      const numChangedIdentifiers = Number(identifierUpdateResult.numChangedRows);

      // Sanity check: number of changed identifiers cannot exceed maximum number of identifiers for the publisher range
      if (numChangedIdentifiers > publisherRangeIdentifierCount) {
        throw new ApiError(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'Internal server error',
          `DB query would have resulted to changing ${numChangedIdentifiers} ISMN identifiers and ISMN publisher range id ${identifierBatch.isbn_publisher_range_id} only may contain maximum of ${publisherRangeIdentifierCount} identifiers.`,
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
  });

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
    throw new Error(`Cannot provide identifiers for batch id ${identifierBatch.id}`);
  }

  return identifiers;
}
