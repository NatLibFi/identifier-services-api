import HttpStatus from 'http-status';

import { ApiError } from '../../utils/api-error.ts';
import { getKysely } from '../../db/database.ts';

import { validateGetById } from '../shared-interface-utils.ts';
import { asMonographIdentifierBatchAdminRead } from '../../dtl/monograph/monograph-identifier-batch-dtl.ts';
import {
  createIsbnIdentifierBatch,
  createIsmnIdentifierBatch,
  deleteIdentifierBatch,
  getBatchIdentifierCount,
  identifierBatchHasDownloads,
  identifierBatchHasMessages,
  identifierBatchHasPublisherPublicationAssignations,
} from './monograph-identifier-batch-interface-utils.ts';

import type {
  MonographIdentifierBatchSelect,
  MonographIdentifierBatchSelectExtended,
} from '../../db/types/monograph/types-monograph-identifier-batch.ts';
import type { RequestUser } from '../../generic-types.ts';
import type { CreateMonographIdentifierBatchHttp } from '../../validations/monograph/monograph-identifier-batch-validation.ts';

export async function readMonographIdentifierBatch(batchId: number) {
  const db = getKysely();
  const identifierBatch = await db
    .selectFrom('monograph_identifier_batch')
    .selectAll()
    .where('id', '=', batchId)
    .execute();

  const result = validateGetById<MonographIdentifierBatchSelect>(identifierBatch);
  const identifierCount = await getBatchIdentifierCount(result);

  return asMonographIdentifierBatchAdminRead(result, identifierCount);
}

export async function createMonographIdentifierBatch(
  params: CreateMonographIdentifierBatchHttp,
  user: RequestUser,
): Promise<MonographIdentifierBatchSelectExtended> {
  const { isbn_publisher_range_id, ismn_publisher_range_id, identifier_count } = params;

  if (isbn_publisher_range_id && !ismn_publisher_range_id) {
    return await createIsbnIdentifierBatch(isbn_publisher_range_id, identifier_count, user);
  } else if (ismn_publisher_range_id && !isbn_publisher_range_id) {
    return await createIsmnIdentifierBatch(ismn_publisher_range_id, identifier_count, user);
  }

  throw new ApiError(
    HttpStatus.UNPROCESSABLE_ENTITY,
    'Unprocessable entity',
    'Batch may only be created for either ISBN publisher range or ISMN publisher range',
  );
}

export async function deleteMonographIdentifierBatch(batchId: number, user: RequestUser) {
  // Const verify batch exists through read
  const identifierBatch = await readMonographIdentifierBatch(batchId);

  // Guard against removing batch that is in use
  // Note: this guard does allow old batches of which system does not contain messages of to be deleted
  const hasAssociatedMessages = await identifierBatchHasMessages(batchId);
  if (hasAssociatedMessages) {
    throw new ApiError(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Unprocessable entity',
      'Identifier batch has been sent as message and thus cannot be deleted.',
    );
  }

  const hasAssociatedDownloads = await identifierBatchHasDownloads(batchId);
  if (hasAssociatedDownloads) {
    throw new ApiError(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Unprocessable entity',
      'Identifier batch has been downloaded by an user and thus cannot be deleted.',
    );
  }

  // Publisher assigned identifiers have both: batch_id and publication_id
  // Having batch_id is pre-requisite for publisher to be able to assign identifiers
  const hasAssociatedPublisherAssignedIdentifiers = await identifierBatchHasPublisherPublicationAssignations(batchId);
  if (hasAssociatedPublisherAssignedIdentifiers) {
    throw new ApiError(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Unprocessable entity',
      'Identifier batch identifiers has already assigned by publisher and thus cannot be deleted.',
    );
  }

  await deleteIdentifierBatch(identifierBatch, user);

  return;
}
