import HttpStatus from 'http-status';

import { SERIAL_PUBLICATION_REQUEST_STATUS, SERIAL_PUBLICATION_STATUS } from '../../constants.ts';

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
  asSerialPublicationAdminRead,
  asSerialPublicationSearchResult,
  type SerialPublicationAdminRead,
} from '../../dtl/serial/serial-publication-dtl.ts';

import {
  assignIssnIdentifier,
  revokeIssnIdentifier,
  getSerialPublicationIssnIdentifier,
} from './issn-identifier-utils.ts';
import {
  changeSerialPublicationStatus,
  getNewSerialPublicationArchiveEntryDbEntry,
  getSerialPublicationArchiveEntry,
} from './serial-publication-interface-utils.ts';

import type { Transaction } from 'kysely';
import type { Database } from '../../db/types.ts';
import type {
  CreateSerialPublicationHttp,
  SearchSerialPublicationHttp,
  UpdateSerialPublicationHttp,
} from '../../validations/serial/serial-publication-validation.ts';
import type { RequestUser } from '../../generic-types.ts';
import type {
  SerialPublicationInsert,
  SerialPublicationUpdate,
} from '../../db/types/serial/types-serial-publication.ts';
import { readSerialPublicationRequest } from './serial-publication-request-interface.ts';
import type { SerialPublicationRequestAdminRead } from '../../dtl/serial/serial-publication-request-dtl.ts';
import type { SerialPublicationRequestUpdate } from '../../db/types/serial/types-serial-publication-request.ts';

export async function readSerialPublication(id: number, trx?: Transaction<Database>) {
  // Use transaction if provided
  const db = trx ? trx : getKysely();

  const dbResult = await db.selectFrom('serial_publication').selectAll().where('id', '=', id).execute();
  const serialPublicationResult = validateGetById(dbResult);

  const archiveEntry = await getSerialPublicationArchiveEntry(id, trx);
  const issnIdentifier = await getSerialPublicationIssnIdentifier(id, trx);

  return asSerialPublicationAdminRead(serialPublicationResult, archiveEntry, issnIdentifier);
}

export async function deleteSerialPublication(id: number, trx?: Transaction<Database>) {
  const publication = await readSerialPublication(id, trx);

  // Publication with ISSN identifier cannot be removed
  if (publication.issn_identifier) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Serial publication id ${id} is associated with issn identifier ${publication.issn_identifier.identifier} and cannot be removed.`,
    );
  }

  // Use transaction if provided, otherwise fallback to controlled transaction
  const controlledTransaction = trx ? null : await getKysely().startTransaction().execute();
  const transaction = trx ? trx : controlledTransaction;

  // Sanity check for typing
  if (!transaction) {
    throw new Error(
      'For some reason, transaction was not defined. This should not ever happen and code branch exists purely for satisfying typing requirements.',
    );
  }

  try {
    // Delete archive entry
    const archiveDeleteResult = await transaction
      .deleteFrom('serial_publication_archive')
      .where('serial_publication_id', '=', id)
      .executeTakeFirstOrThrow();
    validateRowsDeleted(archiveDeleteResult, 1);

    // Delete publication
    const deleteResult = await transaction
      .deleteFrom('serial_publication')
      .where('id', '=', id)
      .executeTakeFirstOrThrow();
    validateRowsDeleted(deleteResult, 1);

    if (controlledTransaction) {
      await controlledTransaction.commit().execute();
    }
  } catch (error) {
    // In case transaction was not provided, controlled transaction needs to be rollbacked manually
    if (controlledTransaction) {
      await controlledTransaction.rollback().execute();
    }

    throw error;
  }

  return;
}

/**
 * Note: if status is updated, no other other attributes may be updated at the same time.
 * Note: serial_publisher_id is managed through publication request interface - it cannot be directly changed
 */
export async function updateSerialPublication(
  id: number,
  serialPublicationUpdateDoc: UpdateSerialPublicationHttp,
  user: RequestUser,
) {
  const publication: SerialPublicationAdminRead = await readSerialPublication(id);
  const hasIssn = Boolean(publication.issn_identifier);

  const db = getKysely();

  const {
    status,
    title,
    subtitle,
    place_of_publication,
    printer,
    issued_from_year,
    issued_from_number,
    frequency,
    frequency_other,
    language,
    medium,
    medium_other,
    url,
    previous,
    main_series,
    subseries,
    another_medium,
    additional_info,
  } = serialPublicationUpdateDoc;

  // Disallow changing medium after ISSN has been assigned
  if (hasIssn && medium) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      'Medium cannot be changed after ISSN has been assigned to publication.',
    );
  }

  // Disallow changing status and making other adjustments at same time
  if (Object.keys(serialPublicationUpdateDoc).length > 1 && status) {
    throw new ApiError(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Unprocessable entity',
      'Serial publication status may only be changed independently from other attributes.',
    );
  }

  if (status) {
    return await changeSerialPublicationStatus(publication, status, user);
  }

  const updateValues: SerialPublicationUpdate = {
    title,
    subtitle,
    place_of_publication,
    printer,
    issued_from_year,
    issued_from_number,
    frequency,
    frequency_other,
    language,
    medium,
    medium_other,
    url,
    additional_info,
    modified: getCurrentTime(),
    modified_by: user.id,
  };

  // Add JSON attributes conditionally
  if (previous) {
    updateValues.previous = JSON.stringify(previous);
  }

  if (main_series) {
    updateValues.main_series = JSON.stringify(main_series);
  }

  if (subseries) {
    updateValues.subseries = JSON.stringify(subseries);
  }

  if (another_medium) {
    updateValues.another_medium = JSON.stringify(another_medium);
  }

  const dbUpdateValues = removeUndefinedProperties<SerialPublicationUpdate>(updateValues);

  // Update within transaction to guarantee change of one row only
  await db.transaction().execute(async (trx) => {
    const updateResult = await trx
      .updateTable('serial_publication')
      .set(dbUpdateValues)
      .where('id', '=', id)
      .executeTakeFirstOrThrow();

    validateRowsUpdatedExact(updateResult, 1);
  });

  return readSerialPublication(id);
}

export async function createSerialPublication(
  p: CreateSerialPublicationHttp,
  requestId: number,
  publisherId: number | null,
  user: RequestUser,
  trx?: Transaction<Database>,
): Promise<number> {
  // Use transaction if provided, otherwise fallback to controlled transaction
  const controlledTransaction = trx ? null : await getKysely().startTransaction().execute();
  const transaction = trx ? trx : controlledTransaction;

  // Sanity check for typing
  if (!transaction) {
    throw new Error(
      'For some reason, transaction was not defined. This should not ever happen and code branch exists purely for satisfying typing requirements.',
    );
  }

  const publicationDbEntry: SerialPublicationInsert = {
    serial_publication_request_id: requestId,
    serial_publisher_id: publisherId,
    title: p.title,
    subtitle: p.subtitle,
    place_of_publication: p.place_of_publication,
    printer: p.printer,
    issued_from_year: p.issued_from_year,
    issued_from_number: p.issued_from_number,
    frequency: p.frequency,
    frequency_other: p.frequency_other,
    language: p.language,
    publication_type: p.publication_type,
    publication_type_other: p.publication_type_other,
    medium: p.medium,
    medium_other: p.medium_other,
    url: p.url,
    previous: JSON.stringify(p.previous ?? []),
    main_series: JSON.stringify(p.main_series ?? []),
    subseries: JSON.stringify(p.subseries ?? []),
    another_medium: JSON.stringify(p.another_medium ?? []),
    additional_info: p.additional_info,
    status: SERIAL_PUBLICATION_STATUS.NO_ISSN_GRANTED,
    created: getCurrentTime(),
    created_by: user.id,
    modified: getCurrentTime(),
    modified_by: user.id,
  };

  let publicationId: number;

  try {
    const publicationInsertResult = await transaction
      .insertInto('serial_publication')
      .values(publicationDbEntry)
      .executeTakeFirstOrThrow();

    validateRowsInserted(publicationInsertResult, 1);

    publicationId = Number(publicationInsertResult.insertId);

    // Sanity check: return value cannot ever be other than number
    if (!publicationId || typeof publicationId !== 'number') {
      throw new Error('Publication ID for newly created publication was missing for some reason!');
    }

    const dbArchiveEntry = getNewSerialPublicationArchiveEntryDbEntry(
      publicationDbEntry,
      Number(publicationInsertResult.insertId),
    );

    const archiveInsertResult = await transaction
      .insertInto('serial_publication_archive')
      .values(dbArchiveEntry)
      .executeTakeFirstOrThrow();

    validateRowsInserted(archiveInsertResult, 1);

    if (controlledTransaction) {
      await controlledTransaction.commit().execute();
    }
  } catch (error) {
    // In case transaction was not provided, controlled transaction needs to be rollbacked manually
    if (controlledTransaction) {
      await controlledTransaction.rollback().execute();
    }

    throw error;
  }

  return publicationId;
}

export async function searchSerialPublication(searchParameters: SearchSerialPublicationHttp) {
  const { search_text, status, serial_publisher_id, limit, offset } = searchParameters;

  const db = getKysely();

  let query = db
    .selectFrom('serial_publication')
    .leftJoin('issn_identifier', 'issn_identifier.serial_publication_id', 'serial_publication.id');

  if (search_text) {
    const normalizedSearch = `%${search_text.trim()}%`.toLowerCase();

    query = query.where((eb) =>
      eb.or([
        eb(eb.fn('lower', ['serial_publication.title']), 'like', normalizedSearch),
        eb(eb.fn('lower', ['serial_publication.subtitle']), 'like', normalizedSearch),
        eb(eb.fn('lower', ['issn_identifier.identifier']), 'like', normalizedSearch),
      ]),
    );
  }

  if (status) {
    query = query.where('serial_publication.status', '=', status);
  }

  if (serial_publisher_id) {
    query = query.where('serial_publication.serial_publisher_id', '=', serial_publisher_id);
  }

  const countQuery = query.clearSelect().select((eb) => eb.fn.countAll().as('total_doc'));
  const { total_doc } = await countQuery.executeTakeFirstOrThrow();

  query = query
    .select([
      'serial_publication.id as id',
      'serial_publication.title as title',
      'serial_publication.language as language',
      'serial_publication.medium as medium',
      'serial_publication.status as status',
      'serial_publication.created as created',
    ])
    .select(['issn_identifier.identifier as issn'])
    .orderBy('id', 'desc')
    .limit(limit)
    .offset(offset);

  // @ts-expect-error TS does not understand typing
  const result: SerialPublicationSearchResult[] = await query.execute();

  return {
    total_doc,
    results: result.map((p) => asSerialPublicationSearchResult(p)),
  };
}

export async function assignSerialPublicationIssnIdentifier(
  publicationId: number,
  user: RequestUser,
  trx?: Transaction<Database>,
) {
  // Use transaction if provided, otherwise fallback to controlled transaction
  const controlledTransaction = trx ? null : await getKysely().startTransaction().execute();
  const transaction = trx ? trx : controlledTransaction;

  // Sanity check for typing
  if (!transaction) {
    throw new Error(
      'For some reason, transaction was not defined. This should not ever happen and code branch exists purely for satisfying typing requirements.',
    );
  }

  try {
    // Read publication and request information
    // Request information is required for deciding whether request status should be changed
    const publication = await readSerialPublication(publicationId, transaction);

    // Disallow assigning ISSN to publication that already has ISSN
    if (publication.issn_identifier) {
      throw new ApiError(
        HttpStatus.CONFLICT,
        'Conflict',
        `ISSN identifier cannot be assigned to serial publication id ${publication.id} because it already has ISSN.`,
      );
    }

    // Disallow assigning ISSN to publication that does not have publisher
    if (!publication.serial_publisher_id) {
      throw new ApiError(
        HttpStatus.CONFLICT,
        'Conflict',
        `ISSN identifier cannot be assigned to serial publication id ${publication.id} because no publisher has been defined for it.`,
      );
    }

    // @ts-expect-error TS does not understand conditional typing here
    const request: SerialPublicationRequestAdminRead = await readSerialPublicationRequest(
      publication.serial_publication_request_id,
      false,
      transaction,
    );

    // Sanity checks regarding statuses
    if (publication.status !== SERIAL_PUBLICATION_STATUS.NO_ISSN_GRANTED) {
      throw new ApiError(
        HttpStatus.CONFLICT,
        'Conflict',
        `ISSN identifier cannot be assigned to serial publication id ${publication.id} because of it's status (${publication.status}).`,
      );
    }

    const unacceptedRequestStatuses = [
      SERIAL_PUBLICATION_REQUEST_STATUS.REJECTED,
      SERIAL_PUBLICATION_REQUEST_STATUS.COMPLETED,
    ];

    if (unacceptedRequestStatuses.includes(request.status)) {
      throw new ApiError(
        HttpStatus.CONFLICT,
        'Conflict',
        `ISSN identifier cannot be assigned to serial publication id ${publication.id} because of it's request status (${request.status}).`,
      );
    }

    // Assign identifier while taking care of ISSN range deactivation if need be
    await assignIssnIdentifier(publication.id, user, transaction);

    // Change publication state
    const publicationDbUpdate: SerialPublicationUpdate = {
      status: SERIAL_PUBLICATION_STATUS.NO_PREPUBLICATION_RECORD,
      modified: getCurrentTime(),
      modified_by: user.id,
    };

    const publicationUpdateResult = await transaction
      .updateTable('serial_publication')
      .set(publicationDbUpdate)
      .where('id', '=', publicationId)
      .executeTakeFirstOrThrow();

    validateRowsUpdatedExact(publicationUpdateResult, 1);

    // If request state requires automatical change, change it
    const hasUnprocessedPublications =
      request.publications.filter((p) => p.id != publicationId && !p.issn_identifier).length > 0;

    if (!hasUnprocessedPublications) {
      const requestDbUpdate: SerialPublicationRequestUpdate = {
        status: SERIAL_PUBLICATION_REQUEST_STATUS.NOT_NOTIFIED,
        modified: getCurrentTime(),
        modified_by: user.id,
      };

      const publicationRequestUpdateResult = await transaction
        .updateTable('serial_publication_request')
        .set(requestDbUpdate)
        .where('id', '=', request.id)
        .executeTakeFirstOrThrow();

      validateRowsUpdatedExact(publicationRequestUpdateResult, 1);
    }

    if (controlledTransaction) {
      await controlledTransaction.commit().execute();
    }

    // Return using read interface for consistency
    return readSerialPublication(publicationId);
  } catch (error) {
    // In case transaction was not provided, controlled transaction needs to be rollbacked manually
    if (controlledTransaction) {
      await controlledTransaction.rollback().execute();
    }

    throw error;
  }
}

export async function revokeSerialPublicationIssnIdentifier(
  publicationId: number,
  user: RequestUser,
  trx?: Transaction<Database>,
) {
  // Use transaction if provided, otherwise fallback to controlled transaction
  const controlledTransaction = trx ? null : await getKysely().startTransaction().execute();
  const transaction = trx ? trx : controlledTransaction;

  // Sanity check for typing
  if (!transaction) {
    throw new Error(
      'For some reason, transaction was not defined. This should not ever happen and code branch exists purely for satisfying typing requirements.',
    );
  }

  try {
    // Read publication and request information
    // Request information is required for deciding whether request status should be changed
    const publication = await readSerialPublication(publicationId, transaction);

    // @ts-expect-error TS does not understand conditional typing here
    const request: SerialPublicationRequestAdminRead = await readSerialPublicationRequest(
      publication.serial_publication_request_id,
      false,
      transaction,
    );

    // Sanity checks
    if (!publication.issn_identifier) {
      throw new ApiError(
        HttpStatus.CONFLICT,
        'Conflict',
        `Serial publication id ${publication.id} does not have ISSN identifier.`,
      );
    }

    if (publication.status == SERIAL_PUBLICATION_STATUS.ISSN_FROZEN) {
      throw new ApiError(
        HttpStatus.CONFLICT,
        'Conflict',
        `ISSN identifier cannot be revoked from serial publication id ${publication.id} because of it's status (${publication.status}).`,
      );
    }

    // Assign identifier while taking care of ISSN range deactivation if need be
    await revokeIssnIdentifier(publication, user, transaction);

    // Change publication state
    const publicationDbUpdate: SerialPublicationUpdate = {
      status: SERIAL_PUBLICATION_STATUS.NO_ISSN_GRANTED,
      modified: getCurrentTime(),
      modified_by: user.id,
    };

    const publicationUpdateResult = await transaction
      .updateTable('serial_publication')
      .set(publicationDbUpdate)
      .where('id', '=', publicationId)
      .executeTakeFirstOrThrow();

    validateRowsUpdatedExact(publicationUpdateResult, 1);

    // If request state requires automatical change, change it
    if (request.status === SERIAL_PUBLICATION_REQUEST_STATUS.NOT_NOTIFIED) {
      const requestDbUpdate: SerialPublicationRequestUpdate = {
        status: SERIAL_PUBLICATION_REQUEST_STATUS.NOT_HANDLED,
        modified: getCurrentTime(),
        modified_by: user.id,
      };

      const publicationRequestUpdateResult = await transaction
        .updateTable('serial_publication_request')
        .set(requestDbUpdate)
        .where('id', '=', request.id)
        .executeTakeFirstOrThrow();

      validateRowsUpdatedExact(publicationRequestUpdateResult, 1);
    }

    if (controlledTransaction) {
      await controlledTransaction.commit().execute();
    }
  } catch (error) {
    // In case transaction was not provided, controlled transaction needs to be rollbacked manually
    if (controlledTransaction) {
      await controlledTransaction.rollback().execute();
    }

    throw error;
  }

  // Return using read interface for consistency
  return readSerialPublication(publicationId);
}
