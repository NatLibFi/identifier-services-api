import HttpStatus from 'http-status';

import { getKysely } from '../../db/database.ts';
import { getCurrentTime, validateGetById } from '../interface-utils/common-interface-utils.ts';

import type { MonographPublicationSelect } from '../../db/types/monograph/types-monograph-publication.ts';

import { asMonographPublicationAdminRead } from '../../dtl/monograph/monograph-publication-dtl.ts';
import { getPublicationExpressions } from './monograph-publication-interface-utils.ts';

import type {
  SearchMonographPublicationHttp,
  UpdateMonographPublicationHttp,
} from '../../validations/monograph/monograph-publication-validation.ts';
import type { RequestUser } from '../../generic-types.ts';
import { ApiError } from '../../utils/api-error.ts';

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

export async function searchMonographPublication(searchParameters: SearchMonographPublicationHttp) {
  const {
    search_text,
    monograph_publisher_id,
    // TODO user,
    limit,
    offset,
  } = searchParameters;

  const db = getKysely();

  // TODO: logic for publisher user to always have constraint of publication monograph_publisher_id

  let query = db.selectFrom('monograph_publication').select('monograph_publication.id');

  // TODO: ISBN identifier search
  // TODO: ISMN identifier search
  // if (search_text && search_text.match(finnishIsbnPublisherStringStart)) {
  //   return {totalDoc: 0, results: []};
  // }

  if (search_text) {
    const normalizedSearch = `%${search_text}%`.toLowerCase();

    query = query.where((eb) => {
      return eb.or([eb(eb.fn('lower', ['primary_title']), 'like', normalizedSearch)]);
    });
  }

  if (monograph_publisher_id) {
    query = query.where('monograph_publisher_id', '=', monograph_publisher_id);
  }

  const countQuery = query.clearSelect().select((eb) => eb.fn.countAll().as('totalDoc'));
  query = query.orderBy('id', 'desc').limit(limit).offset(offset);

  const result = await query.execute();
  const { totalDoc } = await countQuery.executeTakeFirstOrThrow();

  return {
    totalDoc,
    results: await Promise.all(
      result.map(async ({ id }) => {
        // Might have overhead, but limit is capped in validation
        // This may be improved after it's known what attributes are required for each view using this endpoint
        const publication = await readMonographPublication(id);
        return publication;
      }),
    ),
  };
}

export async function mergeMonographPublication(baseId: number, incomingId: number, user: RequestUser) {
  const db = getKysely();

  // Verify both exists by using reads
  const basePublication = await readMonographPublication(baseId);
  const incomingPublication = await readMonographPublication(incomingId);

  // For validating that re-linking requests do not result into unexpected state
  const basePublicationRequests = await db
    .selectFrom('monograph_publication_request')
    .select(['id', 'monograph_publisher_id', 'monograph_publication_id'])
    .where('monograph_publication_id', '=', baseId)
    .execute();

  const incomingPublicationRequests = await db
    .selectFrom('monograph_publication_request')
    .select(['id', 'monograph_publisher_id', 'monograph_publication_id'])
    .where('monograph_publication_id', '=', incomingId)
    .execute();

  const allRequests = basePublicationRequests.concat(incomingPublicationRequests);
  const publisherNotDefined = allRequests.find((r) => r.monograph_publisher_id === null);
  if (publisherNotDefined) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Monograph publication request id ${publisherNotDefined.id} is associated with one of the publications and does not have publisher assigned. Cannot link publications.`,
    );
  }

  const uniquePublisherIds = allRequests.reduce((p: number[], n) => {
    if (n.monograph_publisher_id === null) {
      throw new Error('Publisher cannot be null here!');
    }

    return p.includes(n.monograph_publisher_id) ? p : p.concat(n.monograph_publisher_id);
  }, []);

  // There should be only one non-null publisher id across all publication requests
  if (uniquePublisherIds.length !== 1) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Monograph publications have requests that contain more than one unique monograph publisher id.`,
    );
  }

  // Constraint: publications must have publisher assigned
  if (basePublication.monograph_publisher_id === null || incomingPublication.monograph_publisher_id === null) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      'Cannot combine publications that do not have publisher defined',
    );
  }

  // Constraint: publisher value must be equal
  if (basePublication.monograph_publisher_id !== incomingPublication.monograph_publisher_id) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      'Cannot combine publications that do not belong to same publisher',
    );
  }

  // Current constraint: publication expressions need to have unique type+language combinations
  // If this constraint is removed, one needs to take all re-linking into account that needs to be done regarding expression associations
  // This considers also investigating potential conflict rules for combining manifestations from under multiple expressions to under one expression
  const expressionConflict = basePublication.expressions.some((be) => {
    const incomingExpressionMatch = incomingPublication.expressions.some(
      (ie) => ie.expression_language === be.expression_language && ie.expression_type === be.expression_type,
    );
    return incomingExpressionMatch;
  });

  if (expressionConflict) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      'Cannot combine publications that have expressions which share type and language',
    );
  }

  // Relink all entities associated with incoming publication so that they will be associated with base publication
  await db.transaction().execute(async (trx) => {
    // Process expressions
    await Promise.all(
      incomingPublication.expressions.map(async (e) => {
        // Manifestations are linked to expressions and request
        // But these links stay intact as of now thanks to constraint of requiring unique expressions in validation phase of merge process
        const expressionUpdateResult = await trx
          .updateTable('monograph_publication_expression')
          .set({
            monograph_publication_id: baseId,
            modified: getCurrentTime(),
            modified_by: user.id,
          })
          .where('id', '=', e.id)
          .executeTakeFirstOrThrow();

        if (Number(expressionUpdateResult.numUpdatedRows) !== 1) {
          throw new Error('Unexpected number of rows would have been updated. Throw error to initialize rollback.');
        }
      }),
    );

    // Process requests
    const requestUpdateResult = await trx
      .updateTable('monograph_publication_request')
      .set({
        monograph_publication_id: baseId,
        modified: getCurrentTime(),
        modified_by: user.id,
      })
      .where('monograph_publication_id', '=', incomingPublication.id)
      .executeTakeFirstOrThrow();

    if (Number(requestUpdateResult.numUpdatedRows) !== incomingPublicationRequests.length) {
      throw new Error('Unexpected number of rows would have been updated. Throw error to initialize rollback.');
    }

    // Process removal of old publication
    const incomingPublicationRemovalResult = await trx
      .deleteFrom('monograph_publication')
      .where('id', '=', incomingId)
      .executeTakeFirstOrThrow();

    if (Number(incomingPublicationRemovalResult.numDeletedRows) !== 1) {
      throw new Error('Unexpected number of rows would have been updated. Throw error to initialize rollback.');
    }
  });

  // Re-read to return all latest values
  return readMonographPublication(baseId);
}
