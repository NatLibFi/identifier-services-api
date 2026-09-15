import HttpStatus from 'http-status';

import { ApiError } from '../../utils/api-error.ts';
import { getKysely } from '../../db/database.ts';

import {
  getCurrentTime,
  removeUndefinedProperties,
  validateGetById,
  validateRowsDeleted,
  validateRowsInserted,
  validateRowsUpdatedExact,
} from '../shared-interface-utils.ts';

import {
  asSerialPublicationRequestAdminRead,
  asSerialPublicationRequestAdminReadLite,
  asSerialPublicationRequestSearchResult,
  type SerialPublicationRequestAdminRead,
} from '../../dtl/serial/serial-publication-request-dtl.ts';

import { deleteSerialPublication } from './serial-publication-interface.ts';
import { getNewSerialPublicationArchiveEntryDbEntry } from './serial-publication-interface-utils.ts';

import {
  getNewSerialPublicationRequestArchiveDbEntry,
  getDbSerialPublicationRequestEntries,
  getSerialRequestPublications,
  getSerialPublicationRequestArchiveEntry,
  getSerialPublicationRequestMessages,
  changeSerialPublicationRequestPublisher,
  changeSerialPublicationRequestStatus,
} from './serial-publication-request-interface-utils.ts';

import type {
  CreateSerialPublicationRequestHttp,
  SearchSerialPublicationRequestHttp,
  UpdateSerialPublicationRequestHttp,
} from '../../validations/serial/serial-publication-request-validation.ts';
import type { RequestUser } from '../../generic-types.ts';
import type { SerialPublicationInsert } from '../../db/types/serial/types-serial-publication.ts';
import type {
  SerialPublicationRequestSelect,
  SerialPublicationRequestUpdate,
} from '../../db/types/serial/types-serial-publication-request.ts';

export async function createSerialPublicationRequest(
  serialPublicationRequestCreateDoc: CreateSerialPublicationRequestHttp,
  user: RequestUser,
) {
  const { request, publications } = getDbSerialPublicationRequestEntries(serialPublicationRequestCreateDoc, user);

  const db = getKysely();

  const resultId = await db.transaction().execute(async (trx) => {
    // 1. Create request
    const requestResult = await trx.insertInto('serial_publication_request').values(request).executeTakeFirstOrThrow();
    validateRowsInserted(requestResult, 1);

    const requestId = Number(requestResult.insertId);

    // 2. Create request archive entry
    const requestArchiveEntry = getNewSerialPublicationRequestArchiveDbEntry(request, requestId);
    const requestArchiveResult = await trx
      .insertInto('serial_publication_request_archive')
      .values(requestArchiveEntry)
      .executeTakeFirstOrThrow();
    validateRowsInserted(requestArchiveResult, 1);

    // 3. For each publication create publication entry and publication archive entry
    await Promise.all(
      publications.map(async (p) => {
        const publicationInsertInfo: SerialPublicationInsert = {
          serial_publication_request_id: requestId,
          ...p,
        };
        const publicationResult = await trx
          .insertInto('serial_publication')
          .values(publicationInsertInfo)
          .executeTakeFirstOrThrow();

        validateRowsInserted(publicationResult, 1);

        const publicationResultId = Number(publicationResult.insertId);

        // 4. Create publication archive entry
        const publicationArchiveEntry = getNewSerialPublicationArchiveEntryDbEntry(
          publicationInsertInfo,
          publicationResultId,
        );

        const publicationArchiveResult = await trx
          .insertInto('serial_publication_archive')
          .values(publicationArchiveEntry)
          .executeTakeFirstOrThrow();
        validateRowsInserted(publicationArchiveResult, 1);
      }),
    );

    return requestId;
  });

  return { id: resultId };
}

/**
 * Return value is based on lite-parameter. If used, returns entry without publication and archive entry associations.
 */
export async function readSerialPublicationRequest(
  id: number,
  lite = false,
): Promise<SerialPublicationRequestSelect | SerialPublicationRequestAdminRead> {
  const db = getKysely();
  const dbResult = await db.selectFrom('serial_publication_request').selectAll().where('id', '=', id).execute();
  const serialPublicationRequestResult = validateGetById(dbResult);

  // For cases where associations are not required
  if (lite) {
    return asSerialPublicationRequestAdminReadLite(serialPublicationRequestResult);
  }

  const publications = await getSerialRequestPublications(id);
  const archiveEntry = await getSerialPublicationRequestArchiveEntry(id);

  return asSerialPublicationRequestAdminRead(serialPublicationRequestResult, archiveEntry, publications);
}

/**
 * Note: if serial_publisher_id or status is updated, no other other attributes may be updated at the same time.
 */
export async function updateSerialPublicationRequest(
  id: number,
  serialPublicationRequestUpdateDoc: UpdateSerialPublicationRequestHttp,
  user: RequestUser,
) {
  // @ts-expect-error enforcing return value from union based on second parameter to read
  const request: SerialPublicationRequestAdminRead = await readSerialPublicationRequest(id);

  const db = getKysely();
  const { publisher_name, contact_person, email, phone, address, zip, city, lang_code, serial_publisher_id, status } =
    serialPublicationRequestUpdateDoc;

  // Disallow changing publisher and making other adjustments at same time
  if (Object.keys(serialPublicationRequestUpdateDoc).length > 1 && serial_publisher_id !== undefined) {
    throw new ApiError(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Unprocessable entity',
      'Serial publication request publisher may only be changed independently from other attributes.',
    );
  }

  if (serial_publisher_id !== undefined) {
    return await changeSerialPublicationRequestPublisher(request, serial_publisher_id, user);
  }

  // Disallow changing status and making other adjustments at same time
  if (Object.keys(serialPublicationRequestUpdateDoc).length > 1 && status) {
    throw new ApiError(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Unprocessable entity',
      'Serial publication request status may only be changed independently from other attributes.',
    );
  }

  if (status) {
    return await changeSerialPublicationRequestStatus(request, status, user);
  }

  // Note: old system had restriction regarding changing status manually, but it has been since lifted to satisfy needs for administrators
  const updateValues: SerialPublicationRequestUpdate = {
    publisher_name,
    contact_person,
    email,
    phone,
    address,
    zip,
    city,
    lang_code,
    modified: getCurrentTime(),
    modified_by: user.id,
  };

  const dbUpdateValues = removeUndefinedProperties<SerialPublicationRequestUpdate>(updateValues);

  // Update within transaction to guarantee change of one row only
  await db.transaction().execute(async (trx) => {
    const updateResult = await trx
      .updateTable('serial_publication_request')
      .set(dbUpdateValues)
      .where('id', '=', id)
      .executeTakeFirstOrThrow();

    validateRowsUpdatedExact(updateResult, 1);
  });

  return readSerialPublicationRequest(id, true);
}

/**
 * Entry may be deleted only if no associated publication has ISSN and no messages has been sent
 */
export async function deleteSerialPublicationRequest(id: number) {
  // @ts-expect-error return type validation done later
  const request: SerialPublicationRequestAdminRead = await readSerialPublicationRequest(id);

  // if no request.publications are available, there is a problem in read functionality
  if (!request.publications) {
    throw new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Internal server error',
      `Serial publication request id ${id} publication associations could not be read.`,
    );
  }

  const db = getKysely();
  const publicationIdsWithIdentifier = request.publications
    .filter((p) => Boolean(p.issn_identifier))
    .map(({ id }) => id);

  if (publicationIdsWithIdentifier.length > 0) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Serial publication request id ${id} is associated with publication ids ${publicationIdsWithIdentifier.join(', ')} that have ISSN identifier assigned.`,
    );
  }

  const associatedMessages = await getSerialPublicationRequestMessages(id);
  if (associatedMessages.length > 0) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Serial publication request id ${id} is associated with ${associatedMessages.length} messages and thus cannot be removed.`,
    );
  }

  // Deletion will delete all associated publications and archive entries
  await db.transaction().execute(async (trx) => {
    // 1. Delete publication archive entries
    await Promise.all(
      request.publications.map(async ({ archive_entry }) => {
        if (archive_entry === null) {
          return;
        }

        const publicationArchiveDeleteResult = await trx
          .deleteFrom('serial_publication_archive')
          .where('id', '=', archive_entry.id)
          .executeTakeFirstOrThrow();

        validateRowsDeleted(publicationArchiveDeleteResult, 1);
      }),
    );

    // 2. Delete publications using serial publication interface
    await Promise.all(
      request.publications.map(async ({ id: publicationId }) => {
        await deleteSerialPublication(publicationId, trx);
      }),
    );

    // 3. Delete request archive entry if there is one
    if (request.archive_entry) {
      const publicationRequestArchiveDeleteResult = await trx
        .deleteFrom('serial_publication_request_archive')
        .where('id', '=', request.archive_entry.id)
        .executeTakeFirstOrThrow();

      validateRowsDeleted(publicationRequestArchiveDeleteResult, 1);
    }

    // 4. Delete request
    const publicationRequestDeleteResult = await trx
      .deleteFrom('serial_publication_request')
      .where('id', '=', request.id)
      .executeTakeFirstOrThrow();

    validateRowsDeleted(publicationRequestDeleteResult, 1);
  });

  return;
}

export async function searchSerialPublicationRequest(searchParameters: SearchSerialPublicationRequestHttp) {
  const { search_text, status, serial_publisher_id, limit, offset } = searchParameters;

  const db = getKysely();
  let query = db.selectFrom('serial_publication_request');

  if (search_text) {
    const normalizedSearch = `%${search_text.trim()}%`.toLowerCase();

    query = query.where((eb) =>
      eb.or([
        eb(eb.fn('lower', ['publisher_name']), 'like', normalizedSearch),
        eb(eb.fn('lower', ['email']), 'like', normalizedSearch),
      ]),
    );
  }

  if (status) {
    query = query.where('status', '=', status);
  }

  if (serial_publisher_id) {
    query = query.where('serial_publisher_id', '=', serial_publisher_id);
  }

  const countQuery = query.clearSelect().select((eb) => eb.fn.countAll().as('total_doc'));
  const { total_doc } = await countQuery.executeTakeFirstOrThrow();

  query = query.selectAll('serial_publication_request').orderBy('id', 'desc').limit(limit).offset(offset);

  // @ts-expect-error query builder does not understand typing here
  const result: SerialPublisherSelect[] = await query.execute();

  return {
    total_doc,
    results: await Promise.all(
      result.map(async (p) => {
        const publications = await getSerialRequestPublications(p.id);

        const publicationInfo = publications.reduce(
          (p, n) => {
            p.total += 1;

            if (n.issn_identifier) {
              p.with_issn += 1;
            }

            return p;
          },
          { total: 0, with_issn: 0 },
        );

        return asSerialPublicationRequestSearchResult(p, publicationInfo.total, publicationInfo.with_issn);
      }),
    ),
  };
}
