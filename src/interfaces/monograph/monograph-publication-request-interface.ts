import { getKysely } from '../../db/database.ts';
import { validateGetById } from '../interface-utils/common-interface-utils.ts';

import {
  asMonographPublicationRequestAdminRead,
  asMonographPublicationRequestSearchResult,
} from '../../dtl/monograph/monograph-publication-request-dtl.ts';
import { readMonographPublication } from './monograph-publication-interface.ts';

import {
  getDbPublicationEntry,
  getDbPublicationExpressionEntry,
  getDbPublicationRequestEntry,
} from './monograph-publication-request-interface-utils.ts';

import type { MonographPublicationRequestSelect } from '../../db/types/monograph/types-monograph-publication-request.ts';
import type {
  CreateMonographPublicationRequestV1Http,
  SearchMonographPublicationRequestHttp,
} from '../../validations/monograph/monograph-publication-request-validation.ts';
import type { RequestUser } from '../../generic-types.ts';
import type { CreatedResponse } from '../interface-common-types.ts';

export async function readMonographPublicationRequest(id: number) {
  const db = getKysely();

  const dbResult = await db.selectFrom('monograph_publication_request').selectAll().where('id', '=', id).execute();
  const monographPublicationRequest = validateGetById<MonographPublicationRequestSelect>(dbResult);

  const publication = await readMonographPublication(id);
  const result = asMonographPublicationRequestAdminRead(monographPublicationRequest, publication);

  return result;
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
