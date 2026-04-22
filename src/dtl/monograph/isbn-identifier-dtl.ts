import type { IsbnIdentifierSelect } from '../../db/types/monograph/types-isbn-identifier.ts';

export function asIsbnIdentifierAdminRead(isbnIdentifier: IsbnIdentifierSelect): IsbnIdentifierSelect {
  const {
    id,
    identifier,
    isbn_publisher_range_id,
    monograph_publication_manifestation_id,
    created,
    created_by,
    modified,
    modified_by,
  } = isbnIdentifier;

  return {
    id,
    identifier,
    isbn_publisher_range_id,
    monograph_publication_manifestation_id,
    created,
    created_by,
    modified,
    modified_by,
  };
}
