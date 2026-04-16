// import HttpStatus from 'http-status';

import { getKysely } from '../../db/database.ts';
import {
  getCurrentTime,
  removeUndefinedProperties,
  validateGetById,
} from '../interface-utils/common-interface-utils.ts';

import type { RequestUser } from '../../generic-types.ts';
import type { UpdateMonographPublicationExpression } from '../../validations/monograph/monograph-publication-expression-validation.ts';
import type {
  MonographPublicationExpressionSelect,
  MonographPublicationExpressionUpdate,
} from '../../db/types/monograph/types-monograph-publication-expression.ts';

export async function updateMonographPublicationExpression(
  id: number,
  updateDoc: UpdateMonographPublicationExpression,
  user: RequestUser,
) {
  const db = getKysely();

  const dbResult = await db.selectFrom('monograph_publication_expression').selectAll().where('id', '=', id).execute();
  validateGetById<MonographPublicationExpressionSelect>(dbResult);

  // JSON columns need separate handling
  const processedUpdateDoc: MonographPublicationExpressionUpdate = { ...updateDoc, authors: undefined };

  if ('authors' in updateDoc) {
    processedUpdateDoc.authors = JSON.stringify(updateDoc.authors);
  }

  // Remove undefined values to have full control over update
  const definedUpdateDoc = removeUndefinedProperties(processedUpdateDoc);

  await db.transaction().execute(async (trx) => {
    const updateResult = await trx
      .updateTable('monograph_publication_expression')
      .set({
        ...definedUpdateDoc,
        modified: getCurrentTime(),
        modified_by: user.id,
      })
      .where('id', '=', id)
      .executeTakeFirstOrThrow();

    if (Number(updateResult.numUpdatedRows) !== 1) {
      throw new Error('Unexpected number of rows would have been updated. Throw error to initialize rollback.');
    }
  });

  return;
}
