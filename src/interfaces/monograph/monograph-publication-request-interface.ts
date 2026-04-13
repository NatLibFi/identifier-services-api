// import HttpStatus from 'http-status';

import { getKysely } from '../../db/database.ts';
import { validateGetById } from '../interface-utils/common-interface-utils.ts';

import {
  asMonographPublicationRequestAdminRead,
  asMonographPublicationRequestSearchResult,
} from '../../dtl/monograph/monograph-publication-request-dtl.ts';
import { readMonographPublication } from './monograph-publication-interface.ts';

import {
  getDbPublicationEntryV1,
  getDbPublicationExpressionEntryV1,
  getDbPublicationManifestationEntriesV1,
  getDbPublicationRequestEntryV1,
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
  const v2Publication = getDbPublicationEntryV1(monographPublicationRequestCreateDoc, user);
  const v2PublicationRequest = getDbPublicationRequestEntryV1(monographPublicationRequestCreateDoc, user);
  const v2PublicationExpression = getDbPublicationExpressionEntryV1(monographPublicationRequestCreateDoc, user);
  const v2PublicationManifestations = getDbPublicationManifestationEntriesV1(
    monographPublicationRequestCreateDoc,
    user,
  );

  const db = getKysely();

  const resultId = await db.transaction().execute(async (trx) => {
    // 1. Create publication
    const publicationResult = await trx
      .insertInto('monograph_publication')
      .values(v2Publication)
      .executeTakeFirstOrThrow();

    const publicationResultId = Number(publicationResult.insertId);

    // 2. Create request and associate with publication
    const publicationRequestResult = await trx
      .insertInto('monograph_publication_request')
      .values({
        monograph_publication_id: publicationResultId,
        ...v2PublicationRequest,
      })
      .executeTakeFirstOrThrow();
    const publicationRequestResultId = Number(publicationRequestResult.insertId);

    // 3. Create expression and associate with publication
    const publicationExpressionResult = await trx
      .insertInto('monograph_publication_expression')
      .values({
        monograph_publication_id: publicationResultId,
        ...v2PublicationExpression,
      })
      .executeTakeFirstOrThrow();
    const publicationExpressionResultId = Number(publicationExpressionResult.insertId);

    // 4. Create manifestations and associate with expression and request
    await Promise.all(
      v2PublicationManifestations.map(async (m) => {
        await trx
          .insertInto('monograph_publication_manifestation')
          .values({
            monograph_publication_expression_id: publicationExpressionResultId,
            monograph_publication_request_id: publicationRequestResultId,
            ...m,
          })
          .executeTakeFirstOrThrow();
      }),
    );

    return publicationRequestResultId;
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
    query.where('request_state', '=', request_state);
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
