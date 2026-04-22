// import HttpStatus from 'http-status';

import { getKysely } from '../../db/database.ts';
import { getCurrentTime, validateGetById } from '../interface-utils/common-interface-utils.ts';

import type { MonographPublicationSelect } from '../../db/types/monograph/types-monograph-publication.ts';

import { asMonographPublicationAdminRead } from '../../dtl/monograph/monograph-publication-dtl.ts';
import { getPublicationExpressions } from './monograph-publication-interface-utils.ts';

import type { UpdateMonographPublicationHttp } from '../../validations/monograph/monograph-publication-validation.ts';
import type { RequestUser } from '../../generic-types.ts';

export async function readMonographPublication(id: number) {
  const db = getKysely();
  const dbResult = await db.selectFrom('monograph_publication').selectAll().where('id', '=', id).execute();
  const monographPublication = validateGetById<MonographPublicationSelect>(dbResult);
  const expressions = await getPublicationExpressions(id);

  return asMonographPublicationAdminRead(monographPublication, expressions);
}

export async function updateMonographPublication(
  id: number,
  updateDoc: UpdateMonographPublicationHttp,
  user: RequestUser,
) {
  const db = getKysely();

  const dbResult = await db.selectFrom('monograph_publication').selectAll().where('id', '=', id).execute();
  validateGetById<MonographPublicationSelect>(dbResult);

  // primary_title can be updated directly since it does not have an effect to any association
  await db.transaction().execute(async (trx) => {
    const updateResult = await trx
      .updateTable('monograph_publication')
      .set({
        primary_title: updateDoc.primary_title,
        modified: getCurrentTime(),
        modified_by: user.id,
      })
      .where('id', '=', id)
      .executeTakeFirstOrThrow();

    if (Number(updateResult.numUpdatedRows) !== 1) {
      throw new Error('Unexpected number of rows would have been updated. Throw error to initialize rollback.');
    }
  });

  return readMonographPublication(id);
}
