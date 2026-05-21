import type { MonographPublicationManifestationSelect } from '../../db/types/monograph/types-monograph-publication-manifestation.ts';

export interface MonographPublicationManifestationAdminRead extends MonographPublicationManifestationSelect {
  isbn_identifier: string | null;
  isbn_identifier_assigned: Date | null;
  ismn_identifier?: string | null; // TODO: make not optional
  ismn_identifier_assigned?: Date | null;
}

export interface ValidatedMonographPublicationManifestationAdminRead extends Omit<
  MonographPublicationManifestationSelect,
  'isbn_identifier'
> {
  identifier: string | null;
  identifier_assigned: Date | null;
}

export function asMonographPublicationManifestationAdminRead(
  manifestation: MonographPublicationManifestationAdminRead,
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

  let definedIdentifier: string | null = null;
  let identifierAssigned: Date | null = null;

  if (isbn_identifier) {
    definedIdentifier = isbn_identifier;
    identifierAssigned = isbn_identifier_assigned;
  } else if (ismn_identifier) {
    definedIdentifier = ismn_identifier;
    identifierAssigned = ismn_identifier_assigned ?? null;
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
    identifier: definedIdentifier,
    identifier_assigned: identifierAssigned,
    created,
    created_by,
    modified,
    modified_by,
  };
}
