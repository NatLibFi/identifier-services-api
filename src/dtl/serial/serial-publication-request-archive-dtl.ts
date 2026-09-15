import type { SerialPublicationRequestArchiveSelect } from '../../db/types/serial/types-serial-publication-request-archive.ts';

export function asSerialPublicationRequestArchiveAdminRead(
  e: SerialPublicationRequestArchiveSelect,
): SerialPublicationRequestArchiveSelect {
  const {
    id,
    serial_publication_request_id,
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
  } = e;

  return {
    id,
    serial_publication_request_id,
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
  };
}
