import type { MonographPublicationManifestationSelect } from '../../db/types/monograph/types-monograph-publication-manifestation.ts';

export interface MonographPublicationManifestationAdminRead extends MonographPublicationManifestationSelect {
  isbn_identifier: string | null;
  isbn_identifier_assigned: Date | null;
  ismn_identifier: string | null;
  ismn_identifier_assigned: Date | null;
}

export interface ValidatedMonographPublicationManifestationAdminRead extends MonographPublicationManifestationAdminRead {
  message_sent: boolean;
}

export function asMonographPublicationManifestationAdminRead(
  manifestation: MonographPublicationManifestationAdminRead,
  messageSent: boolean,
): ValidatedMonographPublicationManifestationAdminRead {
  const {
    id,
    monograph_publication_expression_id,
    monograph_publication_request_id,
    manifestation_type,
    manifestation_type_other,
    manifestation_edition,
    publication_year,
    publication_month,
    printing_information,
    series,
    cancelled,
    isbn_identifier,
    isbn_identifier_assigned,
    ismn_identifier,
    ismn_identifier_assigned,
    created,
    created_by,
    modified,
    modified_by,
  } = manifestation;

  if (isbn_identifier && ismn_identifier) {
    throw new Error(
      `Observed monograph publication manifestation having both ISBN identifier (${isbn_identifier}) and ISMN identifier (${ismn_identifier}). This should not happen!`,
    );
  }

  return {
    id,
    monograph_publication_expression_id,
    monograph_publication_request_id,
    manifestation_type,
    manifestation_type_other,
    manifestation_edition,
    publication_year,
    publication_month,
    printing_information,
    series,
    cancelled,
    isbn_identifier,
    isbn_identifier_assigned,
    ismn_identifier,
    ismn_identifier_assigned,
    message_sent: messageSent,
    created,
    created_by,
    modified,
    modified_by,
  };
}
