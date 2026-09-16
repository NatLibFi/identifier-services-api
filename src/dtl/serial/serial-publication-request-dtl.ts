import type { SerialPublicationRequestArchiveSelect } from '../../db/types/serial/types-serial-publication-request-archive.ts';
import type { SerialPublicationRequestSelect } from '../../db/types/serial/types-serial-publication-request.ts';
import type { SerialPublicationAdminRead } from './serial-publication-dtl.ts';

export interface SerialPublicationRequestSelectExtended extends SerialPublicationRequestSelect {
  serial_publisher_name: string | null;
}

export interface SerialPublicationRequestAdminRead extends SerialPublicationRequestSelectExtended {
  archive_entry: SerialPublicationRequestArchiveSelect | null;
  publications: SerialPublicationAdminRead[];
}

export interface SerialPublicationRequestSearchResult {
  id: number;
  status: string;
  publisher_name: string;
  email: string | null;
  publication_count: number;
  publication_count_issn: number;
  created: Date;
}

export function asSerialPublicationRequestAdminRead(
  request: SerialPublicationRequestSelectExtended,
  archive_entry: SerialPublicationRequestArchiveSelect | null,
  publications: SerialPublicationAdminRead[],
): SerialPublicationRequestAdminRead {
  const {
    id,
    serial_publisher_id,
    serial_publisher_name,
    status,
    publisher_name,
    contact_person,
    email,
    phone,
    address,
    zip,
    city,
    lang_code,
    created,
    created_by,
    modified,
    modified_by,
  } = request;

  return {
    id,
    serial_publisher_id,
    serial_publisher_name,
    status,
    publisher_name,
    contact_person,
    email,
    phone,
    address,
    zip,
    city,
    lang_code,
    archive_entry,
    publications,
    created,
    created_by,
    modified,
    modified_by,
  };
}

// Used for HTTP update since archive entry and publications do not change when updating serial publication request
export function asSerialPublicationRequestAdminReadLite(
  request: SerialPublicationRequestSelectExtended,
): SerialPublicationRequestSelectExtended {
  const {
    id,
    serial_publisher_id,
    serial_publisher_name,
    status,
    publisher_name,
    contact_person,
    email,
    phone,
    address,
    zip,
    city,
    lang_code,
    created,
    created_by,
    modified,
    modified_by,
  } = request;

  return {
    id,
    serial_publisher_id,
    serial_publisher_name,
    status,
    publisher_name,
    contact_person,
    email,
    phone,
    address,
    zip,
    city,
    lang_code,
    created,
    created_by,
    modified,
    modified_by,
  };
}

export function asSerialPublicationRequestSearchResult(
  request: SerialPublicationRequestSelect,
  publicationCount: number,
  publicationCountIssn: number,
): SerialPublicationRequestSearchResult {
  const { id, status, publisher_name, email, created } = request;

  return {
    id,
    status,
    publisher_name,
    email,
    publication_count: publicationCount,
    publication_count_issn: publicationCountIssn,
    created,
  };
}
