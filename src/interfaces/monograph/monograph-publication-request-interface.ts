import HttpStatus from 'http-status';

import { getKysely } from '../../db/database.ts';
import { getApplicationLogger } from '../../utils/logging.ts';
import { ApiError } from '../../utils/api-error.ts';

import {
  getCurrentTime,
  removeUndefinedProperties,
  validateGetById,
} from '../interface-utils/common-interface-utils.ts';

import {
  asMonographPublicationRequestAdminRead,
  asMonographPublicationRequestSearchResult,
} from '../../dtl/monograph/monograph-publication-request-dtl.ts';
import { readMonographPublication } from './monograph-publication-interface.ts';

import {
  changeMonographPublicationRequestState,
  changePublicationRequestPublisher,
  getDbPublicationEntry,
  getDbPublicationExpressionEntry,
  getDbPublicationRequestEntry,
} from './monograph-publication-request-interface-utils.ts';

import { assignIsbnIdentifier, getAssignableIsbnIdentifiers } from '../interface-utils/identifier-utils.ts';

import {
  MONOGRAPH_EXPRESSION_TYPES,
  MONOGRAPH_IDENTIFIERS,
  MONOGRAPH_PUBLICATION_REQUEST_STATES,
} from '../../constants.ts';

import type {
  MonographPublicationRequestSelect,
  MonographPublicationRequestSelectExtended,
} from '../../db/types/monograph/types-monograph-publication-request.ts';
import type {
  CreateMonographPublicationRequestV1Http,
  SearchMonographPublicationRequestHttp,
  UpdateMonographPublicationRequestHttp,
} from '../../validations/monograph/monograph-publication-request-validation.ts';
import type { RequestUser } from '../../generic-types.ts';
import type { CreatedResponse } from '../interface-common-types.ts';

export async function readMonographPublicationRequest(id: number) {
  const db = getKysely();

  const dbResult = await db
    .selectFrom('monograph_publication_request')
    .leftJoin('monograph_publisher', 'monograph_publisher.id', 'monograph_publication_request.monograph_publisher_id')
    .selectAll('monograph_publication_request')
    .select(['monograph_publisher.official_name as monograph_publisher_name'])
    .where('monograph_publication_request.id', '=', id)
    .execute();

  const monographPublicationRequest = validateGetById<MonographPublicationRequestSelectExtended>(dbResult);

  const publication = await readMonographPublication(monographPublicationRequest.monograph_publication_id);
  const result = asMonographPublicationRequestAdminRead(monographPublicationRequest, publication);

  return result;
}

export async function updateMonographPublicationRequest(
  id: number,
  updateDoc: UpdateMonographPublicationRequestHttp,
  user: RequestUser,
) {
  const db = getKysely();

  const dbResult = await db.selectFrom('monograph_publication_request').selectAll().where('id', '=', id).execute();
  const validatedDbResult = validateGetById<MonographPublicationRequestSelect>(dbResult);

  const definedUpdateDoc = removeUndefinedProperties(updateDoc);

  // Check first whether update considers monograph publisher association or other properties
  // Deny updating these at same time
  const updatesOtherThanPublisher =
    Object.keys(definedUpdateDoc).filter((k) => k !== 'monograph_publisher_id').length > 0;

  if (definedUpdateDoc.monograph_publisher_id !== undefined && updatesOtherThanPublisher) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      'Monograph publisher id cannot be updated simultaneously to updating other publication request properties.',
    );
  }

  // Process update to monograph publisher association and return directly after the update
  if (definedUpdateDoc.monograph_publisher_id !== undefined) {
    await changePublicationRequestPublisher(validatedDbResult, definedUpdateDoc.monograph_publisher_id, user);
    return;
  }

  // Process update to other attributes than monograph publisher association

  // If request has state of NEW, first update operation will automatically transfer state to IN_PROCESS
  if (validatedDbResult.request_state === MONOGRAPH_PUBLICATION_REQUEST_STATES.NEW) {
    // @ts-expect-error API validation does not know of request_state type on purpose
    definedUpdateDoc.request_state = MONOGRAPH_PUBLICATION_REQUEST_STATES.IN_PROCESS;
  }

  await db.transaction().execute(async (trx) => {
    const updateResult = await trx
      .updateTable('monograph_publication_request')
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

export async function createMonographPublicationRequest(
  monographPublicationRequestCreateDoc: CreateMonographPublicationRequestV1Http,
  user: RequestUser,
): Promise<CreatedResponse> {
  const publication = getDbPublicationEntry(monographPublicationRequestCreateDoc, user);

  const db = getKysely();

  const resultId = await db.transaction().execute(async (trx) => {
    // 1. Create publication
    const publicationResult = await trx
      .insertInto('monograph_publication')
      .values(publication)
      .executeTakeFirstOrThrow();

    const publicationId = Number(publicationResult.insertId);

    // 2. Create request and associate with publication
    const publicationRequest = getDbPublicationRequestEntry(monographPublicationRequestCreateDoc, user, publicationId);
    const publicationRequestResult = await trx
      .insertInto('monograph_publication_request')
      .values(publicationRequest)
      .executeTakeFirstOrThrow();
    const publicationRequestId = Number(publicationRequestResult.insertId);

    // 3. Create expression and associate with publication
    const expressions = getDbPublicationExpressionEntry(monographPublicationRequestCreateDoc, user, publicationId);
    await Promise.all(
      expressions.map(async (e) => {
        const { manifestations, ...dbExpression } = e;

        const expressionResult = await trx
          .insertInto('monograph_publication_expression')
          .values(dbExpression)
          .executeTakeFirstOrThrow();

        const expressionResultId = Number(expressionResult.insertId);

        // 4. Create manifestations and associate with expression and request
        await Promise.all(
          manifestations.map(async (m) => {
            await trx
              .insertInto('monograph_publication_manifestation')
              .values({
                ...m,
                monograph_publication_expression_id: expressionResultId,
                monograph_publication_request_id: publicationRequestId,
              })
              .executeTakeFirstOrThrow();
          }),
        );
      }),
    );

    return publicationRequestId;
  });

  return { id: resultId };
}

export async function searchMonographPublicationRequest(searchParameters: SearchMonographPublicationRequestHttp) {
  const { search_text, request_state, limit, offset } = searchParameters;

  const db = getKysely();

  let query = db
    .selectFrom('monograph_publication_request')
    .leftJoin(
      'monograph_publication',
      'monograph_publication_request.monograph_publication_id',
      'monograph_publication.id',
    )
    .selectAll('monograph_publication_request')
    .select(['monograph_publication.primary_title as publication_primary_title']);

  if (search_text) {
    const normalizedSearch = `%${search_text}%`.toLowerCase();

    query = query.where((eb) =>
      eb.or([
        eb(eb.fn('lower', ['monograph_publication_request.official_name']), 'like', normalizedSearch),
        eb(eb.fn('lower', ['monograph_publication_request.email']), 'like', normalizedSearch),
        eb(eb.fn('lower', ['monograph_publication_request.contact_person']), 'like', normalizedSearch),
        eb(eb.fn('lower', ['monograph_publication.primary_title']), 'like', normalizedSearch),
      ]),
    );
  }

  if (request_state) {
    query = query.where('request_state', '=', request_state);
  }

  const countQuery = query.clearSelect().select((eb) => eb.fn.countAll<number>().as('totalDoc'));
  query = query.orderBy('id', 'desc').limit(limit).offset(offset);

  const result = await query.execute();
  const { totalDoc } = await countQuery.executeTakeFirstOrThrow();

  return {
    totalDoc,
    results: result.map(asMonographPublicationRequestSearchResult),
  };
}

export async function approveMonographPublicationRequest(id: number, user: RequestUser) {
  const logger = getApplicationLogger();
  const db = getKysely();

  const monographPublicationRequest = await db
    .selectFrom('monograph_publication_request')
    .selectAll()
    .where('monograph_publication_request.id', '=', id)
    .execute();

  const validatedMonographPublicationRequest = validateGetById(monographPublicationRequest);

  const publisherId = validatedMonographPublicationRequest.monograph_publisher_id;
  if (!publisherId) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      'Cannot accept request that is not associated with monograph publisher.',
    );
  }

  const publication = await readMonographPublication(validatedMonographPublicationRequest.monograph_publication_id);

  const manifestationIds = publication.expressions.reduce((p: Record<string, number[]>, n) => {
    const identifierType =
      n.expression_type === MONOGRAPH_EXPRESSION_TYPES.SHEET_MUSIC
        ? MONOGRAPH_IDENTIFIERS.ISMN
        : MONOGRAPH_IDENTIFIERS.ISBN;

    // Process only manifestations that:
    //   1. Belong to publication request
    //   2. Are not cancelled
    //   3. Do not yet have identifier assigned to them
    const unprocessedRequestManifestationIds = n.manifestations
      .filter((m) => m.monograph_publication_request_id === id && !m.cancelled && !m.identifier)
      .map(({ id }) => id);

    if (p[identifierType]) {
      p[identifierType] = p[identifierType].concat(unprocessedRequestManifestationIds);
    } else {
      p[identifierType] = unprocessedRequestManifestationIds;
    }

    return p;
  }, {});

  try {
    await db.transaction().execute(async (trx) => {
      const manifestationsRequiringIsbn = manifestationIds[MONOGRAPH_IDENTIFIERS.ISBN];

      // Assign ISBN for all manifestations requiring one that are not cancelled
      if (manifestationsRequiringIsbn) {
        const isbnIdentifiers = await getAssignableIsbnIdentifiers(publisherId, manifestationsRequiringIsbn.length);

        await Promise.all(
          manifestationsRequiringIsbn.map(async (manifestationId, idx) => {
            const identifierString = isbnIdentifiers[idx];
            if (!identifierString) {
              throw new Error('Unexpected error during allocating identifier: identifier string does not exist');
            }

            await assignIsbnIdentifier(manifestationId, identifierString, trx, user);
          }),
        );
      }

      await changeMonographPublicationRequestState(
        validatedMonographPublicationRequest.id,
        MONOGRAPH_PUBLICATION_REQUEST_STATES.ACCEPTED,
        trx,
        user,
      );

      // TODO: assign ISMN identifiers
    });
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
      throw new ApiError(
        HttpStatus.CONFLICT,
        'Conflict',
        'Publisher does not have enough available identifiers for request to be approved.',
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

  return;
}

export async function rejectMonographPublicationRequest(id: number, user: RequestUser) {
  const logger = getApplicationLogger();
  const db = getKysely();

  const monographPublicationRequest = await db
    .selectFrom('monograph_publication_request')
    .selectAll()
    .where('monograph_publication_request.id', '=', id)
    .execute();

  validateGetById(monographPublicationRequest);

  try {
    await db.transaction().execute(async (trx) => {
      await changeMonographPublicationRequestState(id, MONOGRAPH_PUBLICATION_REQUEST_STATES.REJECTED, trx, user);
    });
  } catch (error) {
    const hasDetails = error instanceof Error;
    if (!hasDetails) {
      throw new ApiError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
        'Unknown error occurred during identifier assignation.',
      );
    }

    if (error.cause === 'Manifestation has identifier') {
      throw new ApiError(
        HttpStatus.CONFLICT,
        'Conflict',
        'Publisher request manifestation has identifier assigned and thus the request cannot be rejected.',
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

  return;
}
