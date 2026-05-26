import HttpStatus from 'http-status';

import { getKysely } from '../../db/database.ts';
import {
  getCurrentTime,
  removeUndefinedProperties,
  validateGetById,
} from '../interface-utils/common-interface-utils.ts';
import { getExpressionsManifestations } from './monograph-publication-interface-utils.ts';

import { ApiError } from '../../utils/api-error.ts';
import { MONOGRAPH_PUBLICATION_REQUEST_STATES } from '../../constants.ts';

import type { RequestUser } from '../../generic-types.ts';
import type {
  AddMonographPublicationExpression,
  UpdateMonographPublicationExpression,
} from '../../validations/monograph/monograph-publication-expression-validation.ts';
import type {
  MonographPublicationExpressionSelect,
  MonographPublicationExpressionUpdate,
} from '../../db/types/monograph/types-monograph-publication-expression.ts';
import { asMonographPublicationExpressionAdminRead } from '../../dtl/monograph/monograph-publication-expression-dtl.ts';
import { readMonographPublication } from './monograph-publication-interface.ts';

export async function readMonographPublicationExpression(id: number) {
  const db = getKysely();

  const expression = await db.selectFrom('monograph_publication_expression').selectAll().where('id', '=', id).execute();

  const validatedExpression = validateGetById(expression);

  const manifestations = await getExpressionsManifestations([id]);
  const typedManifestations = manifestations[id] || []; // TS constraint is satisfied like this

  return asMonographPublicationExpressionAdminRead(validatedExpression, typedManifestations);
}

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

  return readMonographPublicationExpression(id);
}

export async function addMonographPublicationExpression(
  createDoc: AddMonographPublicationExpression,
  user: RequestUser,
) {
  const {
    monograph_publication_id,
    expression_type,
    expression_language,
    authors,
    title,
    subtitle,
    map_scale,
    manifestations,
  } = createDoc;

  const db = getKysely();

  // Sanity check
  if (!monograph_publication_id) {
    throw new ApiError(HttpStatus.CONFLICT, 'Conflict', 'Cannot create expression without adding it to publication');
  }

  // Validate publication through read - implicitly manages returning 404 in case entity does not exist
  await readMonographPublication(monograph_publication_id);

  // Currently no constraints are placed: it is possible to create another expression with similar type/language combination with matching title

  const dbDoc = {
    monograph_publication_id,
    expression_type,
    expression_language,
    authors: JSON.stringify(authors),
    title,
    subtitle,
    map_scale,
    created: getCurrentTime(),
    created_by: user.id,
    modified: getCurrentTime(),
    modified_by: user.id,
  };

  // Create within transaction and add manifestations
  const resultId = await db.transaction().execute(async (trx) => {
    const expressionResult = await trx
      .insertInto('monograph_publication_expression')
      .values(dbDoc)
      .executeTakeFirstOrThrow();

    const expressionResultId = Number(expressionResult.insertId);

    await Promise.all(
      manifestations.map(async (m) => {
        const dbManifestation = {
          ...m,
          monograph_publication_expression_id: expressionResultId,
          monograph_publication_request_id: null,
          series: JSON.stringify(m.series),
          printing_information: JSON.stringify(m.printing_information),
          cancelled: false,
          created: getCurrentTime(),
          created_by: user.id,
          modified: getCurrentTime(),
          modified_by: user.id,
        };

        await trx.insertInto('monograph_publication_manifestation').values(dbManifestation).executeTakeFirstOrThrow();
      }),
    );

    return expressionResultId;
  });

  return readMonographPublicationExpression(resultId);
}

export async function deleteMonographPublicationExpression(expressionId: number, allowLastExpressionDelete = false) {
  // Constraints:
  // - Cannot be last expression unless a separate flag is defined (allows utilizing interface for publication removal interface)
  // - Any manifestation cannot have identifier assigned

  const db = getKysely();
  const expression = await readMonographPublicationExpression(expressionId);
  const publication = await readMonographPublication(expression.monograph_publication_id);
  const numPublicationExpression = publication.expressions.length;

  if (!allowLastExpressionDelete && numPublicationExpression === 1) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      'Cannot remove last expression. Use publication removal interface instead if you desire to remove the whole publication.',
    );
  }

  const manifestationsHaveIdentifiers = expression.manifestations.filter(
    (m) => typeof m.identifier === 'string' && m.identifier.length > 0,
  ).length;

  if (manifestationsHaveIdentifiers) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      'Cannot remove expression which contains manifestations that have ISBN or ISMN identifier assigned to it.',
    );
  }

  // Remove manifestations and expression within one transaction
  await db.transaction().execute(async (trx) => {
    const manifestationRemoveResult = await trx
      .deleteFrom('monograph_publication_manifestation')
      .where('monograph_publication_expression_id', '=', expressionId)
      .executeTakeFirstOrThrow();

    // Sanity check
    const numDeletedManifestations = Number(manifestationRemoveResult.numDeletedRows);
    if (numDeletedManifestations !== expression.manifestations.length) {
      throw new Error('Removal of manifestations resulted into unexpected result. Rolling transaction back.');
    }

    const expressionRemoveResult = await trx
      .deleteFrom('monograph_publication_expression')
      .where('id', '=', expressionId)
      .executeTakeFirstOrThrow();

    const numDeletedExpressions = Number(expressionRemoveResult.numDeletedRows);
    if (numDeletedExpressions !== 1) {
      throw new Error('Removal of expression resulted into unexpected result. Rolling transaction back.');
    }
  });

  return;
}
