import type { MonographPublicationRequestSelect } from '../../db/types/monograph/types-monograph-publication-request.ts';
import type { MonographPublicationAdminRead } from './monograph-publication-dtl.ts';

export interface MonographPublicationRequestAdminRead extends MonographPublicationRequestSelect {
  publication: MonographPublicationAdminRead;
}

export function asMonographPublicationRequestAdminRead(
  monographPublicationRequest: MonographPublicationRequestSelect,
  publication: MonographPublicationAdminRead,
): MonographPublicationRequestAdminRead {
  const {
    id,
    monograph_publisher_id,
    monograph_publication_id,
    official_name,
    publisher_identifier_str,
    address,
    zip,
    city,
    phone,
    email,
    lang_code,
    contact_person,
    published_before,
    publishing_activity,
    publishing_activity_amount,
    publications_intra,
    publications_public,
    comments,
    on_process,
    created,
    created_by,
    modified,
    modified_by,
  } = monographPublicationRequest;

  return {
    id,
    monograph_publisher_id,
    monograph_publication_id,
    official_name,
    publisher_identifier_str,
    address,
    zip,
    city,
    phone,
    email,
    lang_code,
    contact_person,
    published_before,
    publishing_activity,
    publishing_activity_amount,
    publications_intra,
    publications_public,
    comments,
    on_process,
    publication,
    created,
    created_by,
    modified,
    modified_by,
  };
}
