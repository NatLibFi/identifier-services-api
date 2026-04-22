// import HttpStatus from 'http-status';

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
