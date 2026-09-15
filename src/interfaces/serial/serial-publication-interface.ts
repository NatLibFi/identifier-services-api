import HttpStatus from 'http-status';

import { ApiError } from '../../utils/api-error.ts';
import { getKysely } from '../../db/database.ts';
import { validateGetById, validateRowsDeleted } from '../shared-interface-utils.ts';

import { asSerialPublicationAdminRead } from '../../dtl/serial/serial-publication-dtl.ts';

import { getSerialPublicationIssnIdentifier } from './issn-identifier-utils.ts';
import { getSerialPublicationArchiveEntry } from './serial-publication-interface-utils.ts';

import type { Transaction } from 'kysely';
import type { Database } from '../../db/types.ts';

export async function readSerialPublication(id: number, trx?: Transaction<Database>) {
  // Use transaction if provided
  const db = trx ? trx : getKysely();

  const dbResult = await db.selectFrom('serial_publication').selectAll().where('id', '=', id).execute();
  const serialPublicationResult = validateGetById(dbResult);

  const archiveEntry = await getSerialPublicationArchiveEntry(id, trx);
  const issnIdentifier = await getSerialPublicationIssnIdentifier(id, trx);

  return asSerialPublicationAdminRead(serialPublicationResult, archiveEntry, issnIdentifier);
}

export async function deleteSerialPublication(id: number, trx?: Transaction<Database>) {
  // Use transaction if provided
  const db = trx ? trx : getKysely();

  const publication = await readSerialPublication(id, trx);
  if (publication.issn_identifier) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Serial publication id ${id} is associated with issn identifier ${publication.issn_identifier.identifier} and cannot be removed.`,
    );
  }

  const deleteResult = await db.deleteFrom('serial_publication').where('id', '=', id).executeTakeFirstOrThrow();
  validateRowsDeleted(deleteResult, 1);

  return;
}
