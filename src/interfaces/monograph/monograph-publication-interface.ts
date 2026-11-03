import { getCurrentTime, validateGetById, validateRowsUpdatedExact } from '../shared-interface-utils.ts';
import {
  getAssociatedPublicationRequestId,
  getPublicationExpressions,
} from './monograph-publication-interface-utils.ts';
import { changeStatusNewToProcessed } from './monograph-publication-request-interface-utils.ts';

import { getKysely } from '../../db/database.ts';
import { asMonographPublicationAdminRead } from '../../dtl/monograph/monograph-publication-dtl.ts';

import type { MonographPublicationSelect } from '../../db/types/monograph/types-monograph-publication.ts';
import type { RequestUser } from '../../generic-types.ts';
import type {
  SearchMonographPublicationHttp,
  UpdateMonographPublicationHttp,
} from '../../validations/monograph/monograph-publication-validation.ts';

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

    validateRowsUpdatedExact(updateResult, 1);

    // Change associated request state if need be
    const publicationRequestId = await getAssociatedPublicationRequestId(id);
    if (publicationRequestId) {
      await changeStatusNewToProcessed(publicationRequestId, user, trx);
    }
  });

  return readMonographPublication(id);
}

export async function searchMonographPublication(searchParameters: SearchMonographPublicationHttp) {
  const { search_text, monograph_publisher_id, limit, offset } = searchParameters;

  const db = getKysely();
  let query = db.selectFrom('monograph_publication').select('monograph_publication.id');

  if (search_text) {
    const normalizedSearch = `%${search_text}%`.toLowerCase();

    query = query.where((eb) => {
      return eb.or([eb(eb.fn('lower', ['primary_title']), 'like', normalizedSearch)]);
    });
  }

  if (monograph_publisher_id) {
    query = query.where('monograph_publisher_id', '=', monograph_publisher_id);
  }

  const countQuery = query.clearSelect().select((eb) => eb.fn.countAll().as('total_doc'));
  query = query.orderBy('id', 'desc').limit(limit).offset(offset);

  const result = await query.execute();
  const { total_doc } = await countQuery.executeTakeFirstOrThrow();

  return {
    total_doc,
    results: await Promise.all(
      result.map(async ({ id }) => {
        // Might have overhead, but limit is capped in validation
        // This may be improved after it's known what attributes are required for each view using this endpoint
        const publication = await readMonographPublication(id);

        // Enrich information with knowledge about publication requests
        const publicationRequestId = await db
          .selectFrom('monograph_publication_request')
          .select('id')
          .where('monograph_publication_id', '=', id)
          .executeTakeFirst();

        return {
          ...publication, // Uses normal DTL
          monograph_publication_request_id: publicationRequestId?.id ?? null,
        };
      }),
    ),
  };
}
