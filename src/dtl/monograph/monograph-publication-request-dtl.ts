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
    request_state,
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
    request_state,
    publication,
    created,
    created_by,
    modified,
    modified_by,
  };
}

export interface MonographPublicationRequestSearchExtension {
  publication_primary_title: string | null;
}

export interface MonographPublicationRequestSearchResult extends MonographPublicationRequestSearchExtension {
  id: number;
  official_name: string;
  contact_person: string | null;
  email: string | null;
  created: Date;
}

export function asMonographPublicationRequestSearchResult(
  monographPublicationRequest: MonographPublicationRequestSelect & MonographPublicationRequestSearchExtension,
): MonographPublicationRequestSearchResult {
  const { id, official_name, publication_primary_title, contact_person, email, created } = monographPublicationRequest;

  return {
    id,
    official_name,
    publication_primary_title,
    contact_person,
    email,
    created,
  };
}
