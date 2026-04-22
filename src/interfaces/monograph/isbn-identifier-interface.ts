import { getKysely } from '../../db/database.ts';
import { assignIsbnIdentifier, getAssignableIsbnIdentifier } from '../interface-utils/monograph-identifier-utils.ts';

import type { RequestUser } from '../../generic-types.ts';

export async function assignManifestationIsbnIdentifier(manifestationId: number, user: RequestUser) {
  // TODO: access control for publisher role

  const db = getKysely();
  const isbnIdentifier = await getAssignableIsbnIdentifier(manifestationId);

  await db.transaction().execute(async (trx) => {
    await assignIsbnIdentifier(manifestationId, isbnIdentifier, trx, user);
  });

  return;
}
