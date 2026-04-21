import HttpStatus from 'http-status';

import { getKysely } from '../../db/database.ts';
import {
  getCurrentTime,
  removeUndefinedProperties,
  validateGetById,
} from '../interface-utils/common-interface-utils.ts';

import type { RequestUser } from '../../generic-types.ts';
import type { UpdateMonographPublicationManifestation } from '../../validations/monograph/monograph-publication-manifestation-validation.ts';
import type {
  MonographPublicationManifestationSelect,
  MonographPublicationManifestationUpdate,
} from '../../db/types/monograph/types-monograph-publication-manifestation.ts';
import { ApiError } from '../../utils/api-error.ts';
import { MONOGRAPH_IDENTIFIERS, MONOGRAPH_PUBLICATION_REQUEST_STATES } from '../../constants.ts';
import {
  assignIsbnIdentifier,
  deassignIsbnIdentifier,
  getAssignableIsbnIdentifier,
  getExpressionIdentifierType,
} from '../interface-utils/monograph-identifier-utils.ts';
import { getApplicationLogger } from '../../utils/logging.ts';

export async function updateMonographPublicationManifestation(
  id: number,
  updateDoc: UpdateMonographPublicationManifestation,
  user: RequestUser,
) {
  const db = getKysely();

  const dbResult = await db
    .selectFrom('monograph_publication_manifestation')
    .leftJoin(
      'isbn_identifier',
      'isbn_identifier.monograph_publication_manifestation_id',
      'monograph_publication_manifestation.id',
    )
    // TODO: left join for ISMN identifier
    .selectAll('monograph_publication_manifestation')
    .select(['isbn_identifier.identifier as isbn_identifier'])
    .where('monograph_publication_manifestation.id', '=', id)
    .execute();

  const validatedDbResult = validateGetById<MonographPublicationManifestationSelect>(dbResult);

  // Some properties may not be updated if manifestation has been assigned an identifier
  const hasIdentifier = Boolean(validatedDbResult.isbn_identifier);
  const disallowedChangesAfterIdentifier = [
    'manifestation_type',
    'manifestation_type_other',
    'publication_year',
    'publication_month',
    'manifestation_edition',
  ];
  const keyRequiringNoIdentifier = Object.keys(updateDoc).find((k) => disallowedChangesAfterIdentifier.includes(k));

  if (hasIdentifier && keyRequiringNoIdentifier) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Monograph publisher manifestation already has identifier assigned. Property ${keyRequiringNoIdentifier} cannot be changed after an identifier has been assigned.`,
    );
  }

  // JSON columns need separate handling
  const processedUpdateDoc: MonographPublicationManifestationUpdate = {
    ...updateDoc,
    authors: undefined,
    series: undefined,
    printing_information: undefined,
  };

  if ('authors' in updateDoc) {
    processedUpdateDoc.authors = JSON.stringify(updateDoc.authors);
  }

  if ('series' in updateDoc) {
    processedUpdateDoc.series = JSON.stringify(updateDoc.series);
  }

  if ('printing_information' in updateDoc) {
    processedUpdateDoc.printing_information = JSON.stringify(updateDoc.printing_information);
  }

  // Remove undefined values to have full control over update
  const definedUpdateDoc = removeUndefinedProperties(processedUpdateDoc);

  // Check whether request is associated and requires automatic state update from NEW to IN_PROCESS
  const request = validatedDbResult.monograph_publication_request_id
    ? await db.selectFrom('monograph_publication_request').select('request_state').executeTakeFirstOrThrow()
    : undefined;
  const requestStateNeedsUpdate = request?.request_state === MONOGRAPH_PUBLICATION_REQUEST_STATES.NEW;

  await db.transaction().execute(async (trx) => {
    const updateResult = await trx
      .updateTable('monograph_publication_manifestation')
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
    if (requestStateNeedsUpdate) {
      const requestUpdateResult = await trx
        .updateTable('monograph_publication_request')
        .set({
          request_state: MONOGRAPH_PUBLICATION_REQUEST_STATES.IN_PROCESS,
          modified: getCurrentTime(),
          modified_by: user.id,
        })
        .where('id', '=', validatedDbResult.monograph_publication_request_id)
        .executeTakeFirstOrThrow();

      if (Number(requestUpdateResult.numUpdatedRows) !== 1) {
        throw new Error('Unexpected number of rows would have been updated. Throw error to initialize rollback.');
      }
    }
  });

  return;
}

export async function assignManifestationIdentifier(id: number, user: RequestUser) {
  const logger = getApplicationLogger();
  const db = getKysely();

  const manifestation = await db
    .selectFrom('monograph_publication_manifestation')
    .leftJoin(
      'isbn_identifier',
      'isbn_identifier.monograph_publication_manifestation_id',
      'monograph_publication_manifestation.id',
    )
    .leftJoin(
      'monograph_publication_request',
      'monograph_publication_request.id',
      'monograph_publication_manifestation.monograph_publication_request_id',
    )
    // TODO: left join for ISMN identifier
    .selectAll('monograph_publication_manifestation')
    .select(['isbn_identifier.identifier as isbn_identifier'])
    .select(['monograph_publication_request.request_state as request_state'])
    .where('monograph_publication_manifestation.id', '=', id)
    .execute();

  const validManifestation = validateGetById(manifestation);

  // TODO: add access control mechanism for publisher user
  // TODO: evaluate appropriate constraints for publisher user

  // TODO: add ISMN constraint
  if (validManifestation.isbn_identifier) {
    throw new ApiError(HttpStatus.CONFLICT, 'Conflict', 'Manifestation has already identifier assigned to it.');
  }

  // Disallow assigning identifier for entries associated with rejected request
  if (validManifestation.request_state === MONOGRAPH_PUBLICATION_REQUEST_STATES.REJECTED) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      'Publication manifestation is associated rejected publisher request.',
    );
  }

  // Check identifier type for expression
  const identifierType = await getExpressionIdentifierType(validManifestation.monograph_publication_expression_id);

  try {
    if (identifierType === MONOGRAPH_IDENTIFIERS.ISBN) {
      const isbnIdentifier = await getAssignableIsbnIdentifier(id);

      await db.transaction().execute(async (trx) => {
        await assignIsbnIdentifier(id, isbnIdentifier, trx, user);
      });

      return;
    }
  } catch (error) {
    const hasDetails = error instanceof Error;
    if (!hasDetails) {
      throw new ApiError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
        'Unknown error occurred during identifier assignation.',
      );
    }

    if (error.cause === 'Inadequate number of identifiers') {
      throw new ApiError(HttpStatus.CONFLICT, 'Conflict', 'Publisher does not have enough available identifiers.');
    }

    if (error.cause === 'No publisher defined') {
      throw new ApiError(
        HttpStatus.CONFLICT,
        'Conflict',
        'Publication manifestation is associated with does not have publisher defined.',
      );
    }

    // Catch-all in case some cause is added to function but forgotten to add here
    logger.warn(`Underlying cause for error: ${error.cause}`);
    throw new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Internal server error',
      'Unknown error occurred during identifier assignation.',
    );
  }

  // TODO: ISMN assignment process

  throw new ApiError(
    HttpStatus.UNPROCESSABLE_ENTITY,
    'Unprocessable entity',
    'Could not process linked expression expression_type.',
  );
}

export async function deassignManifestationIdentifier(id: number, user: RequestUser) {
  const logger = getApplicationLogger();
  const db = getKysely();

  const manifestation = await db
    .selectFrom('monograph_publication_manifestation')
    .leftJoin(
      'isbn_identifier',
      'isbn_identifier.monograph_publication_manifestation_id',
      'monograph_publication_manifestation.id',
    )
    .leftJoin(
      'monograph_publication_request',
      'monograph_publication_request.id',
      'monograph_publication_manifestation.monograph_publication_request_id',
    )
    // TODO: left join for ISMN identifier
    .selectAll('monograph_publication_manifestation')
    .select(['isbn_identifier.identifier as isbn_identifier'])
    .select(['monograph_publication_request.request_state as request_state'])
    .where('monograph_publication_manifestation.id', '=', id)
    .execute();

  // TODO: check if messages have been sent regarding the publication request
  // TODO: evaluate if there are other constraints that need to be added

  // TODO: add access control mechanism for publisher user
  // TODO: evaluate appropriate constraints for publisher user

  const validManifestation = validateGetById(manifestation);

  // TODO: add ISMN constraint
  if (!validManifestation.isbn_identifier) {
    throw new ApiError(HttpStatus.CONFLICT, 'Conflict', 'Manifestation does not have ISBN identifier assigned to it.');
  }

  // Disallow assigning identifier for entries associated with rejected request
  if (
    validManifestation.request_state &&
    validManifestation.request_state !== MONOGRAPH_PUBLICATION_REQUEST_STATES.IN_PROCESS
  ) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      'Manifestation that is part of publication request may not have its identifier deassigned unless the request is IN_PROCESS state.',
    );
  }

  // Check identifier type for expression
  const identifierType = await getExpressionIdentifierType(validManifestation.monograph_publication_expression_id);

  try {
    if (identifierType === MONOGRAPH_IDENTIFIERS.ISBN) {
      await db.transaction().execute(async (trx) => {
        await deassignIsbnIdentifier(id, trx, user);
      });

      return;
    }
  } catch (error) {
    logger.warn('Unexpected error during deassigning manifestation identifier: ', error);
    throw new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Internal server error',
      'Unknown error occurred during identifier deassignation.',
    );
  }

  // TODO: ISMN deassignment process

  throw new ApiError(
    HttpStatus.UNPROCESSABLE_ENTITY,
    'Unprocessable entity',
    'Could not process linked expression expression_type.',
  );
}
