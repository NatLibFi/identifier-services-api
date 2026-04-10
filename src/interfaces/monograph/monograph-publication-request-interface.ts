// import HttpStatus from 'http-status';

import { getKysely } from '../../db/database.ts';
import { validateGetById } from '../interface-utils/common-interface-utils.ts';

import {
  asMonographPublicationRequestAdminRead,
  asMonographPublicationRequestSearchResult,
} from '../../dtl/monograph/monograph-publication-request-dtl.ts';
import { readMonographPublication } from './monograph-publication-interface.ts';

import type { MonographPublicationRequestSelect } from '../../db/types/monograph/types-monograph-publication-request.ts';
import type { SearchMonographPublicationRequestHttp } from '../../validations/monograph/monograph-publication-request-validation.ts';

export async function readMonographPublicationRequest(id: number) {
  const db = getKysely();

  const dbResult = await db.selectFrom('monograph_publication_request').selectAll().where('id', '=', id).execute();
  const monographPublicationRequest = validateGetById<MonographPublicationRequestSelect>(dbResult);

  const publication = await readMonographPublication(id);
  const result = asMonographPublicationRequestAdminRead(monographPublicationRequest, publication);

  return result;
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
