import { createHash } from 'crypto';
import HttpStatus from 'http-status';

import { ApiError } from '../../utils/api-error.ts';
import { getKysely } from '../../db/database.ts';

import { getCurrentTime, validateGetById } from '../shared-interface-utils.ts';
import { asMonographIdentifierBatchAdminRead } from '../../dtl/monograph/monograph-identifier-batch-dtl.ts';
import {
  createIsbnIdentifierBatch,
  createIsmnIdentifierBatch,
  deleteIdentifierBatch,
  getBatchIdentifierCount,
  getIdentifierBatchIdentifiers,
  identifierBatchHasDownloads,
  identifierBatchHasMessages,
  identifierBatchHasPublisherPublicationAssignations,
} from './monograph-identifier-batch-interface-utils.ts';

import { isProduction } from '../../utils/generic-utils.ts';
import { readMonographPublisher } from './monograph-publisher-interface.ts';

import type {
  MonographIdentifierBatchSelect,
  MonographIdentifierBatchSelectExtended,
} from '../../db/types/monograph/types-monograph-identifier-batch.ts';
import type { RequestUser } from '../../generic-types.ts';
import type { CreateMonographIdentifierBatchHttp } from '../../validations/monograph/monograph-identifier-batch-validation.ts';
import { MONOGRAPH_IDENTIFIERS } from '../../constants.ts';

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

// Note: this is exposed for GET monograph/identifier-batches/:id
// The use case for normal read is to provide internal interface and use case for providing information for UI needs different information
export async function readPublicMonographIdentifierBatch(batchId: number) {
  const db = getKysely();
  const identifierBatch = await db
    .selectFrom('monograph_identifier_batch as mib')
    .leftJoin('monograph_publisher as mp', 'mp.id', 'mib.monograph_publisher_id')
    .selectAll('mib')
    .select(['mp.official_name as monograph_publisher_name'])
    .where('mib.id', '=', batchId)
    .execute();

  const result = validateGetById(identifierBatch);
  const identifierCount = await getBatchIdentifierCount(result);

  let identifierType: string;

  if (result.isbn_publisher_range_id && !result.ismn_publisher_range_id) {
    identifierType = MONOGRAPH_IDENTIFIERS.ISBN;
  } else if (!result.isbn_publisher_range_id && result.ismn_publisher_range_id) {
    identifierType = MONOGRAPH_IDENTIFIERS.ISMN;
  } else {
    throw new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Internal server error',
      'Unknown problem occurred with data. Please contact customer service.',
    );
  }

  // Always require publisher name to be defined
  if (!result.monograph_publisher_name) {
    throw new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Internal server error',
      'Unknown problem occurred with data. Please contact customer service.',
    );
  }

  const batchPublicInfo = {
    id: batchId,
    monograph_publisher_name: result.monograph_publisher_name,
    identifier_type: identifierType,
    identifier_count: identifierCount,
  };

  return batchPublicInfo;
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

export async function downloadMonographIdentifierBatch(batchId: number) {
  const identifierBatch = await readMonographIdentifierBatch(batchId);
  const identifiers = await getIdentifierBatchIdentifiers(identifierBatch);
  const monographPublisher = await readMonographPublisher(identifierBatch.monograph_publisher_id);

  const db = getKysely();
  const containsPublisherAssignedPublication = identifiers.some(
    (i) => i.monograph_publication_manifestation_id !== null,
  );

  // Disallow downloading identifiers that are managed by publishers within this system
  // Downloads are provided only for managing entries outside of this system
  if (containsPublisherAssignedPublication) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      'Identifier batch contains identifier entries that are managed within the identifier services system.',
    );
  }

  // Format to text file to include publisher information
  let headerText = `Seuraavat tunnukset on myönnetty kustantajalle ${monographPublisher.official_name}\r\n`;
  headerText += `Följande identifikatorer har tilldelats åt förlaget ${monographPublisher.official_name}\r\n`;
  headerText += `Following identifiers have been assigned to publisher ${monographPublisher.official_name}\r\n\r\n`;

  // Add test header for test environment
  if (!isProduction()) {
    headerText +=
      'SEURAAVAT TUNNUKSET ON TUOTETTU TESTIJÄRJESTELMÄSTÄ JA NIITÄ EI MISSÄÄN NIMESSÄ PIDÄ OIKEASTI KÄYTTÄÄ!\r\n';
    headerText += 'FÖLJANDE IDENTIFIKATORER ÄR FRÅN TEST SYSTEMET. ANVÄND DEM INTE!\r\n';
    headerText += 'FOLLOWING IDENTIFIERS HAVE BEEN PRODUCED IN TEST SYSTEM. DO NOT USE THEM!\r\n\r\n';
  }

  const resultBody = identifiers.reduce((acc: string, { identifier }) => `${acc}${identifier}\r\n`, '');
  const sha256sum = createHash('sha256').update(resultBody).digest('hex');

  // Save download entry to db
  await db
    .insertInto('monograph_identifier_batch_download')
    .values({
      monograph_identifier_batch_id: batchId,
      sha256sum,
      created: getCurrentTime(),
    })
    .executeTakeFirstOrThrow();

  return `${headerText}${resultBody}`;
}
