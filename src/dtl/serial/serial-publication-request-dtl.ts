import type { SerialPublicationRequestArchiveSelect } from '../../db/types/serial/types-serial-publication-request-archive.ts';
import type { SerialPublicationRequestSelect } from '../../db/types/serial/types-serial-publication-request.ts';
import type { SerialPublicationAdminRead } from './serial-publication-dtl.ts';

export interface SerialPublicationRequestAdminRead extends SerialPublicationRequestSelect {
  archive_entry: SerialPublicationRequestArchiveSelect | null;
  publications: SerialPublicationAdminRead[];
}

export function asSerialPublicationRequestAdminRead(
  request: SerialPublicationRequestSelect,
  archive_entry: SerialPublicationRequestArchiveSelect | null,
  publications: SerialPublicationAdminRead[],
): SerialPublicationRequestAdminRead {
  const {
    id,
    serial_publisher_id,
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
  request: SerialPublicationRequestSelect,
): SerialPublicationRequestSelect {
  const {
    id,
    serial_publisher_id,
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
