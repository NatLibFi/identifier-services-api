import type { IssnIdentifierSelect } from '../../db/types/serial/types-issn-identifier.ts';
import type { SerialPublicationArchiveSelect } from '../../db/types/serial/types-serial-publication-archive.ts';
import type { SerialPublicationSelect } from '../../db/types/serial/types-serial-publication.ts';

export interface SerialPublicationSearchResult {
  id: number;
  issn: string | null;
  title: string;
  language: string | null;
  medium: string;
  status: string;
  created: Date;
}

export interface SerialPublicationAdminRead extends SerialPublicationSelect {
  issn_identifier: IssnIdentifierSelect | null;
  archive_entry: SerialPublicationArchiveSelect | null;
}

function getSerialPublicationIssnIdentifier(issnIdentifier: IssnIdentifierSelect | null) {
  if (!issnIdentifier) {
    return null;
  }

  const { id, issn_range_id, serial_publication_id, identifier, created, created_by, modified, modified_by } =
    issnIdentifier;

  return {
    id,
    issn_range_id,
    serial_publication_id,
    identifier,
    created,
    created_by,
    modified,
    modified_by,
  };
}

function getSerialPublicationArchiveEntry(archiveEntry: SerialPublicationArchiveSelect | null) {
  if (!archiveEntry) {
    return null;
  }

  const {
    id,
    serial_publication_id,
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
    created,
    created_by,
  } = archiveEntry;

  return {
    id,
    serial_publication_id,
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
    created,
    created_by,
  };
}

export function asSerialPublicationAdminRead(
  serialPublication: SerialPublicationSelect,
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
  } = serialPublication;

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
    issn_identifier: getSerialPublicationIssnIdentifier(issnIdentifier),
    archive_entry: getSerialPublicationArchiveEntry(archiveEntry),
    created,
    created_by,
    modified,
    modified_by,
  };
}

export function asSerialPublicationSearchResult(
  serialPublicationSearchResult: SerialPublicationSearchResult,
): SerialPublicationSearchResult {
  const { id, issn, title, language, medium, status, created } = serialPublicationSearchResult;

  return {
    id,
    issn,
    title,
    language,
    medium,
    status,
    created,
  };
}
