import type { IssnIdentifierSelect } from '../../db/types/serial/types-isnn-identifier.ts';

export function asIssnIdentifierAdminRead(i: IssnIdentifierSelect): IssnIdentifierSelect {
  const { id, issn_range_id, serial_publication_id, identifier, created, created_by, modified, modified_by } = i;
  return { id, issn_range_id, serial_publication_id, identifier, created, created_by, modified, modified_by };
}
