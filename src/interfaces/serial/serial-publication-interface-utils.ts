import HttpStatus from 'http-status';

import { getKysely } from '../../db/database.ts';
import { ApiError } from '../../utils/api-error.ts';
import { getCurrentTime } from '../shared-interface-utils.ts';

import { asSerialPublicationArchiveAdminRead } from '../../dtl/serial/serial-publication-archive-dtl.ts';

import type { SerialPublicationInsert } from '../../db/types/serial/types-serial-publication.ts';
import type {
  SerialPublicationArchiveInsert,
  SerialPublicationArchiveSelect,
} from '../../db/types/serial/types-serial-publication-archive.ts';
import type { Database } from '../../db/types.ts';
import type { Transaction } from 'kysely';

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
