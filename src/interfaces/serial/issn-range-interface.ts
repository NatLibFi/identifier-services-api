import HttpStatus from 'http-status';

import { ApiError } from '../../utils/api-error.ts';
import { getKysely } from '../../db/database.ts';
import {
  getCurrentTime,
  validateGetById,
  validateRowsDeleted,
  validateRowsInserted,
} from '../shared-interface-utils.ts';
import { asIssnRangeAdminRead, type IssnRangeRead } from '../../dtl/serial/issn-range-dtl.ts';
import {
  createIssnRangeIdentifiers,
  getIssnRangeConflict,
  processIssnRangeActiveEdit,
} from './issn-range-interface-utils.ts';

import type { RequestUser } from '../../generic-types.ts';
import type { IssnRangeSelect } from '../../db/types/serial/types-issn-range.ts';
import type { CreateIssnRangeHttp, UpdateIssnRangeHttp } from '../../validations/serial/issn-range-validation.ts';

export async function getIssnRanges() {
  const db = getKysely();
  const resultIds = await db.selectFrom('issn_range').select('id').execute();

  // TODO: eval if need using subquery
  return await Promise.all(resultIds.map(async ({ id }) => await readIssnRange(id)));
}

export async function createIssnRange(issnRangeCreateDoc: CreateIssnRangeHttp, user: RequestUser) {
  const conflictingIssnRanges = await getIssnRangeConflict(issnRangeCreateDoc);

  if (conflictingIssnRanges.length > 0) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `ISSN range cannot be created due to conflict between existing ISSN ranges (ids: ${conflictingIssnRanges.map(({ id }) => id).join(', ')})`,
    );
  }

  const db = getKysely();

  const { block, range_begin, range_end } = issnRangeCreateDoc;

  // Create operation is done within transaction as range is created together with associated ISSN identifiers
  const issnRangeId = await db.transaction().execute(async (trx) => {
    const result = await db
      .insertInto('issn_range')
      .values({
        block,
        range_begin,
        range_end,
        active: false, // By default range is not active
        created: getCurrentTime(),
        created_by: user.id,
        modified: getCurrentTime(),
        modified_by: user.id,
      })
      .executeTakeFirstOrThrow();

    validateRowsInserted(result, 1);

    // Create associated identifiers
    await createIssnRangeIdentifiers(issnRangeCreateDoc, Number(result.insertId), user, trx);

    return Number(result.insertId);
  });

  return { id: issnRangeId };
}

export async function readIssnRange(id: number): Promise<IssnRangeRead> {
  const db = getKysely();
  const dbResult = await db.selectFrom('issn_range').selectAll().where('id', '=', id).execute();
  const issnRangeResult = validateGetById<IssnRangeSelect>(dbResult);

  // Enrich with number of available identifiers
  const { count: usedIdentifiersCount } = await db
    .selectFrom('issn_identifier')
    .select(db.fn.countAll<number>().as('count'))
    .where('serial_publication_id', 'is not', null)
    .where('issn_range_id', '=', id)
    .executeTakeFirstOrThrow();

  const { count: totalIdentifiersCount } = await db
    .selectFrom('issn_identifier')
    .select(db.fn.countAll<number>().as('count'))
    .where('issn_range_id', '=', id)
    .executeTakeFirstOrThrow();

  return asIssnRangeAdminRead(issnRangeResult, usedIdentifiersCount, totalIdentifiersCount);
}

export async function updateIssnRange(id: number, issnRangeUpdateDoc: UpdateIssnRangeHttp, user: RequestUser) {
  const { active } = issnRangeUpdateDoc;

  await processIssnRangeActiveEdit(id, active, user);
  return;
}

export async function deleteIssnRange(id: number) {
  const db = getKysely();

  const { count: numIssnIdentifiers } = await db
    .selectFrom('issn_identifier')
    .select(db.fn.countAll<number>().as('count'))
    .where('issn_range_id', '=', id)
    .executeTakeFirstOrThrow();

  const { count: numUsedIssnIdentifiers } = await db
    .selectFrom('issn_identifier')
    .select(db.fn.countAll<number>().as('count'))
    .where('serial_publication_id', 'is not', null)
    .where('issn_range_id', '=', id)
    .executeTakeFirstOrThrow();

  if (numUsedIssnIdentifiers !== 0) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `ISSN range id ${id} has ${numUsedIssnIdentifiers} associated ISSN identifiers assigned to publications.`,
    );
  }

  await db.transaction().execute(async (trx) => {
    const rangeRemoveResult = await trx.deleteFrom('issn_range').where('id', '=', id).executeTakeFirstOrThrow();
    validateRowsDeleted(rangeRemoveResult, 1);

    const identifierRemoveResult = await trx
      .deleteFrom('issn_identifier')
      .where('serial_publication_id', 'is', null)
      .where('issn_range_id', '=', id)
      .executeTakeFirstOrThrow();

    validateRowsDeleted(identifierRemoveResult, numIssnIdentifiers);
  });

  return;
}
