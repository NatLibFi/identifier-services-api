import HttpStatus from 'http-status';

import { getKysely } from '../../db/database.ts';
import { ApiError } from '../../utils/api-error.ts';
import { getCurrentTime, validateRowsUpdatedExact } from '../shared-interface-utils.ts';

import { asSerialPublicationArchiveAdminRead } from '../../dtl/serial/serial-publication-archive-dtl.ts';

import { SERIAL_PUBLICATION_STATUS } from '../../constants.ts';
import { readSerialPublication } from './serial-publication-interface.ts';

import type { SerialPublicationInsert } from '../../db/types/serial/types-serial-publication.ts';
import type {
  SerialPublicationArchiveInsert,
  SerialPublicationArchiveSelect,
} from '../../db/types/serial/types-serial-publication-archive.ts';
import type { Database } from '../../db/types.ts';
import type { Transaction } from 'kysely';
import type { SerialPublicationAdminRead } from '../../dtl/serial/serial-publication-dtl.ts';
import type { RequestUser } from '../../generic-types.ts';

export function getNewSerialPublicationArchiveEntryDbEntry(
  p: SerialPublicationInsert,
  publicationId: number,
): SerialPublicationArchiveInsert {
  return {
    serial_publication_id: publicationId,
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
    previous: p.previous,
    main_series: p.main_series,
    subseries: p.subseries,
    another_medium: p.another_medium,
    additional_info: p.additional_info,
    created: getCurrentTime(),
    created_by: p.created_by,
  };
}

export async function getSerialPublicationArchiveEntry(
  serialPublicationId: number,
  trx?: Transaction<Database>,
): Promise<SerialPublicationArchiveSelect | null> {
  // Use transaction if provided
  const db = trx ? trx : getKysely();

  const dbResult = await db
    .selectFrom('serial_publication_archive')
    .selectAll()
    .where('serial_publication_id', '=', serialPublicationId)
    .execute();

  const archiveEntry = dbResult[0];

  if (dbResult.length === 0 || !archiveEntry) {
    return null;
  }

  if (dbResult.length > 1) {
    throw new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Internal server error',
      `Serial publication id ${serialPublicationId} is associated with ${dbResult.length} archive entries. This should not happen. Please notify system administrators.`,
    );
  }

  return asSerialPublicationArchiveAdminRead(archiveEntry);
}

export async function changeSerialPublicationStatus(
  p: SerialPublicationAdminRead,
  newStatus: string,
  user: RequestUser,
) {
  // Disallow update operation on no status change
  const statusNotChanged = newStatus === p.status;
  if (statusNotChanged) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Serial publication id ${p.id} status is already ${newStatus} - refusing to re-save.`,
    );
  }

  // Block rejecting request if ISSN identifier has already been assigned
  const hasIssn = Boolean(p.issn_identifier);
  const rejecting = newStatus === SERIAL_PUBLICATION_STATUS.NO_ISSN_GRANTED;

  if (hasIssn && rejecting) {
    throw new ApiError(HttpStatus.CONFLICT, 'Conflict', `Serial publication id ${p.id} has ISSN already.`);
  }

  // Block other transitions since they require ISSN has been assigned already
  const statusRequiringIssn = [
    SERIAL_PUBLICATION_STATUS.NO_PREPUBLICATION_RECORD,
    SERIAL_PUBLICATION_STATUS.ISSN_FROZEN,
    SERIAL_PUBLICATION_STATUS.WAITING_FOR_CONTROL_COPY,
    SERIAL_PUBLICATION_STATUS.COMPLETED,
  ];

  if (!hasIssn && statusRequiringIssn) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Serial publication id ${p.id} does not have ISSN, but given status (${newStatus}) requires publication to have one.`,
    );
  }

  const db = getKysely();
  await db.transaction().execute(async (trx) => {
    const publicationDbUpdate = { status: newStatus, modified: getCurrentTime(), modified_by: user.id };
    const publicationUpdateResult = await trx
      .updateTable('serial_publication')
      .set(publicationDbUpdate)
      .where('id', '=', p.id)
      .executeTakeFirstOrThrow();

    validateRowsUpdatedExact(publicationUpdateResult, 1);
  });

  return readSerialPublication(p.id);
}
