import type { IssnIdentifierSelect } from '../../db/types/serial/types-isnn-identifier.ts';
import type { SerialPublicationArchiveSelect } from '../../db/types/serial/types-serial-publication-archive.ts';
import type { SerialPublicationSelect } from '../../db/types/serial/types-serial-publication.ts';

export interface SerialPublicationAdminRead extends SerialPublicationSelect {
  issn_identifier: IssnIdentifierSelect | null;
  archive_entry: SerialPublicationArchiveSelect | null;
}

export function asSerialPublicationAdminRead(
  p: SerialPublicationSelect,
  archiveEntry: SerialPublicationArchiveSelect | null,
  issnIdentifier: IssnIdentifierSelect | null,
): SerialPublicationAdminRead {
  const {
    id,
    serial_publication_request_id,
    serial_publisher_id,
    title,
    subtitle,
    place_of_publication,
    printer,
    issued_from_year,
    issued_from_number,
    frequency,
    frequency_other,
    language,
    publication_type,
    publication_type_other,
    medium,
    medium_other,
    url,
    previous,
    main_series,
    subseries,
    another_medium,
    additional_info,
    status,
    created,
    created_by,
    modified,
    modified_by,
  } = p;

  return {
    id,
    serial_publication_request_id,
    serial_publisher_id,
    title,
    subtitle,
    place_of_publication,
    printer,
    issued_from_year,
    issued_from_number,
    frequency,
    frequency_other,
    language,
    publication_type,
    publication_type_other,
    medium,
    medium_other,
    url,
    previous,
    main_series,
    subseries,
    another_medium,
    additional_info,
    status,
    issn_identifier: issnIdentifier,
    archive_entry: archiveEntry,
    created,
    created_by,
    modified,
    modified_by,
  };
}
