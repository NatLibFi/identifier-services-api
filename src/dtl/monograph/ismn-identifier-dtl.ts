import type { IsmnIdentifierSelect } from '../../db/types/monograph/types-ismn-identifier.ts';

export function asIsmnIdentifierAdminRead(ismnIdentifier: IsmnIdentifierSelect): IsmnIdentifierSelect {
  const {
    id,
    identifier,
    ismn_publisher_range_id,
    monograph_publication_manifestation_id,
    created,
    created_by,
    modified,
    modified_by,
  } = ismnIdentifier;

  return {
    id,
    identifier,
    ismn_publisher_range_id,
    monograph_publication_manifestation_id,
    created,
    created_by,
    modified,
    modified_by,
  };
}
