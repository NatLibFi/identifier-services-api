import type { IssnIdentifierSelect } from '../../db/types/serial/types-issn-identifier.ts';

export function asIssnIdentifierAdminRead(issnIdentifier: IssnIdentifierSelect): IssnIdentifierSelect {
  const { id, issn_range_id, serial_publication_id, identifier, created, created_by, modified, modified_by } =
    issnIdentifier;
  return { id, issn_range_id, serial_publication_id, identifier, created, created_by, modified, modified_by };
}
