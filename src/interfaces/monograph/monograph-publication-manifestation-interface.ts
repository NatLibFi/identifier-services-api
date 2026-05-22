import HttpStatus from 'http-status';

import { getKysely } from '../../db/database.ts';
import { ApiError } from '../../utils/api-error.ts';
import { MONOGRAPH_IDENTIFIERS, MONOGRAPH_PUBLICATION_REQUEST_STATES } from '../../constants.ts';

import { getApplicationLogger } from '../../utils/logging.ts';
import {
  getCurrentTime,
  removeUndefinedProperties,
  validateGetById,
} from '../interface-utils/common-interface-utils.ts';
import {
  assignIsbnIdentifier,
  deassignIsbnIdentifier,
  getAssignableIsbnIdentifier,
  getExpressionIdentifierType,
} from '../interface-utils/monograph-identifier-utils.ts';

import { asMonographPublicationManifestationAdminRead } from '../../dtl/monograph/monograph-publication-manifestation-dtl.ts';

import type { RequestUser } from '../../generic-types.ts';
import type {
  AddMonographPublicationManifestation,
  UpdateMonographPublicationManifestation,
} from '../../validations/monograph/monograph-publication-manifestation-validation.ts';
import type {
  MonographPublicationManifestationSelect,
  MonographPublicationManifestationUpdate,
} from '../../db/types/monograph/types-monograph-publication-manifestation.ts';
import { readMonographPublicationExpression } from './monograph-publication-expression-interface.ts';

export async function readMonographPublicationManifestation(id: number) {
  const db = getKysely();

  const manifestation = await db
    .selectFrom('monograph_publication_manifestation')
    .leftJoin(
      'isbn_identifier',
      'isbn_identifier.monograph_publication_manifestation_id',
      'monograph_publication_manifestation.id',
    )
    // TODO: left join for ISMN identifier
    .selectAll('monograph_publication_manifestation')
    .select(['isbn_identifier.identifier as isbn_identifier', 'isbn_identifier.modified as isbn_identifier_assigned'])
    .where('monograph_publication_manifestation.id', '=', id)
    .execute();

  const validatedManifestation = validateGetById(manifestation);
  return asMonographPublicationManifestationAdminRead(validatedManifestation);
}

export async function updateMonographPublicationManifestation(
  id: number,
  updateDoc: UpdateMonographPublicationManifestation,
  user: RequestUser,
) {
  const db = getKysely();

  const origManifestation = await db
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

  const validatedOrigManifestation = validateGetById<MonographPublicationManifestationSelect>(origManifestation);

  // Some properties may not be updated if manifestation has been assigned an identifier
  const hasIdentifier = Boolean(validatedOrigManifestation.isbn_identifier);
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
    series: undefined,
    printing_information: undefined,
  };

  if ('series' in updateDoc) {
    processedUpdateDoc.series = JSON.stringify(updateDoc.series);
  }

  if ('printing_information' in updateDoc) {
    processedUpdateDoc.printing_information = JSON.stringify(updateDoc.printing_information);
  }

  // Remove undefined values to have full control over update
  const definedUpdateDoc = removeUndefinedProperties(processedUpdateDoc);

  // Check whether request is associated and requires automatic state update from NEW to IN_PROCESS
  const request = validatedOrigManifestation.monograph_publication_request_id
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
        .where('id', '=', validatedOrigManifestation.monograph_publication_request_id)
        .executeTakeFirstOrThrow();

      if (Number(requestUpdateResult.numUpdatedRows) !== 1) {
        throw new Error('Unexpected number of rows would have been updated. Throw error to initialize rollback.');
      }
    }
  });

  return readMonographPublicationManifestation(id);
}

export async function addMonographPublicationManifestation(
  createDoc: AddMonographPublicationManifestation,
  user: RequestUser,
) {
  const {
    monograph_publication_expression_id,
    manifestation_type,
    manifestation_type_other,
    manifestation_edition,
    publication_month,
    publication_year,
    series,
    printing_information,
  } = createDoc;

  const db = getKysely();

  // Sanity check
  if (!monograph_publication_expression_id) {
    throw new ApiError(HttpStatus.CONFLICT, 'Conflict', 'Cannot create manifestation without adding it to expression');
  }

  // Validate expression through using interface read - implicitly manages returning 404 in case entity does not exist
  await readMonographPublicationExpression(monograph_publication_expression_id);

  const printingInformation = printing_information ?? [];
  const seriesInformation = series ?? [];

  const dbDoc = {
    monograph_publication_expression_id,
    monograph_publication_request_id: null,
    cancelled: false,
    manifestation_type,
    manifestation_type_other: manifestation_type_other ?? null,
    manifestation_edition: manifestation_edition ?? null,
    publication_month,
    publication_year,
    series: JSON.stringify(seriesInformation),
    printing_information: JSON.stringify(printingInformation),
    created: getCurrentTime(),
    created_by: user.id,
    modified: getCurrentTime(),
    modified_by: user.id,
  };

  const result = await db.insertInto('monograph_publication_manifestation').values(dbDoc).executeTakeFirstOrThrow();
  return { id: Number(result.insertId) };
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

      return readMonographPublicationManifestation(id);
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

      return readMonographPublicationManifestation(id);
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
