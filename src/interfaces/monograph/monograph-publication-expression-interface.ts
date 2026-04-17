import HttpStatus from 'http-status';

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
import { getExpressionsManifestations } from './monograph-publication-interface-utils.ts';
import { ApiError } from '../../utils/api-error.ts';
import { MONOGRAPH_PUBLICATION_REQUEST_STATES } from '../../constants.ts';

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

  // TODO: disallow updates such as expression_type or expression_language after manifestation have had identifiers assigned
  const disallowedChangesAfterIdentifier = ['expression_type', 'expression_language'];
  const keyRequiringNoIdentifier = Object.keys(updateDoc).find((k) => disallowedChangesAfterIdentifier.includes(k));

  const { [id]: manifestations } = await getExpressionsManifestations([id]);
  const manifestationHasIdentifier = manifestations?.find((m) => m.identifier !== null && m.identifier.length > 0);

  if (manifestationHasIdentifier && keyRequiringNoIdentifier) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `One of expression manifestations already has an identifier assigned. Property ${keyRequiringNoIdentifier} cannot be changed after an identifier has been assigned for any manifestation.`,
    );
  }

  // During first save of any publication request related entry, request_state transfer occurs
  const publicationRequestId = manifestations?.find(
    (m) => m.monograph_publication_request_id,
  )?.monograph_publication_request_id;
  const publicationRequest = publicationRequestId
    ? await db.selectFrom('monograph_publication_request').select('request_state').executeTakeFirstOrThrow()
    : undefined;
  const updatePublicationRequest = publicationRequest?.request_state === MONOGRAPH_PUBLICATION_REQUEST_STATES.NEW;

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

    // Update associated request if necessary
    if (publicationRequestId && updatePublicationRequest) {
      const requestUpdateResult = await trx
        .updateTable('monograph_publication_request')
        .set({
          request_state: MONOGRAPH_PUBLICATION_REQUEST_STATES.IN_PROCESS,
          modified: getCurrentTime(),
          modified_by: user.id,
        })
        .where('id', '=', publicationRequestId)
        .executeTakeFirstOrThrow();

      if (Number(requestUpdateResult.numUpdatedRows) !== 1) {
        throw new Error('Unexpected number of rows would have been updated. Throw error to initialize rollback.');
      }
    }
  });

  return;
}
