import HttpStatus from 'http-status';

import { ApiError } from '../../utils/api-error.ts';
import { getKysely } from '../../db/database.ts';
import { getIsbnRangeConflict } from './isbn-range-interface-utils.ts';
import { getCurrentTime, validateGetById } from '../interface-utils/common-interface-utils.ts';
import { asIsbnRangeAdminRead } from '../../dtl/monograph/isbn-range-dtl.ts';

import type { IsbnRangeRead } from '../../db/types/monograph/types-isbn-range.ts';
import type { CreateIsbnRangeHttp, UpdateIsbnRangeHttp } from '../../validations/monograph/isbn-range-validation.ts';
import type { CreatedResponse } from '../interface-common-types.ts';
import type { RequestUser } from '../../generic-types.ts';

interface IsbnRangeAdminResponse {
  id: number;
  gs1: string;
  registration_group: string;
  range_begin: string;
  range_end: string;
  active: boolean;
  // TODO: free
  created: string;
  created_by: string;
  modified: string;
  modified_by: string;
}

export async function getIsbnRanges() {
  const db = getKysely();
  // TODO: add dynamic "free" attribute based on associated publisher ranges
  const result = await db.selectFrom('isbn_range').selectAll().execute();
  return result.map(transformToResponse);

  function transformToResponse(isbnRangeResult: IsbnRangeRead): IsbnRangeAdminResponse {
    return {
      id: isbnRangeResult.id,
      gs1: isbnRangeResult.gs1,
      registration_group: isbnRangeResult.registration_group,
      range_begin: isbnRangeResult.range_begin,
      range_end: isbnRangeResult.range_end,
      active: isbnRangeResult.active,
      // TODO: free
      created: isbnRangeResult.created.toISOString(),
      created_by: isbnRangeResult.created_by,
      modified: isbnRangeResult.modified.toISOString(),
      modified_by: isbnRangeResult.modified_by,
    };
  }
}

export async function createIsbnRange(
  isbnRangeCreateDoc: CreateIsbnRangeHttp,
  user: RequestUser,
): Promise<CreatedResponse> {
  const conflictingIsbnRanges = await getIsbnRangeConflict(isbnRangeCreateDoc);

  if (conflictingIsbnRanges.length > 0) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `ISBN range cannot be created due to conflict between existing ISBN ranges (ids: ${conflictingIsbnRanges.map(({ id }) => id).join(', ')})`,
    );
  }

  const { gs1, registration_group, range_begin, range_end } = isbnRangeCreateDoc;
  const db = getKysely();

  const result = await db
    .insertInto('isbn_range')
    .values({
      gs1,
      registration_group,
      range_begin,
      range_end,
      active: true,
      created: getCurrentTime(),
      created_by: user.id,
      modified: getCurrentTime(),
      modified_by: user.id,
    })
    .executeTakeFirstOrThrow();

  return { id: Number(result.insertId) };
}

export async function readIsbnRange(id: number, useDtl = true) {
  const db = getKysely();
  const dbResult = await db.selectFrom('isbn_range').selectAll().where('id', '=', id).execute();
  const isbnRangeResult = validateGetById<IsbnRangeRead>(dbResult);

  return useDtl ? asIsbnRangeAdminRead(isbnRangeResult) : isbnRangeResult;
}

export async function updateIsbnRange(id: number, isbnRangeUpdateDoc: UpdateIsbnRangeHttp, user: RequestUser) {
  const { active, range_begin, range_end } = isbnRangeUpdateDoc;

  // Process update depending on its type
  if (active !== undefined) {
    await processIsbnRangeActiveEdit(id, active, user);
  } else {
    await processIsbnRangeEdit(id, range_begin, range_end, user);
  }

  // Use consistent return value between processing. This will be one additional read as overhead, but currently it's acceptable.
  return readIsbnRange(id);
}

export async function processIsbnRangeActiveEdit(id: number, active: boolean, user: RequestUser) {
  const currentRange = await readIsbnRange(id, false);

  const noStateChange =
    (active === true && currentRange.active === true) || (active === false && currentRange.active === false);

  if (noStateChange) {
    throw new ApiError(HttpStatus.CONFLICT, 'Conflict', `ISBN ${currentRange.id} has already active=${active}`);
  }

  // TODO: allow activate only of there are free publisher ranges
  const db = getKysely();
  await db
    .updateTable('isbn_range')
    .set({
      active,
      modified_by: user.id,
      modified: getCurrentTime(),
    })
    .where('id', '=', currentRange.id)
    .executeTakeFirstOrThrow();

  return;
}

export async function processIsbnRangeEdit(
  id: number,
  range_begin: string | undefined,
  range_end: string | undefined,
  user: RequestUser,
) {
  const currentRange = await readIsbnRange(id, false);

  // Verify range adjustment does not conflict with other existing ranges
  const proposedRangeEdit = {
    gs1: currentRange.gs1,
    registration_group: currentRange.registration_group,
    range_begin: range_begin || currentRange.range_begin,
    range_end: range_end || currentRange.range_end,
  };

  // Sanity check: verify there would be adjustment (API validation should confirm this, but just in case)
  const rangeBeginAdjusted = proposedRangeEdit.range_begin !== currentRange.range_begin;
  const rangeEndAdjusted = proposedRangeEdit.range_end !== currentRange.range_end;

  if (!rangeBeginAdjusted && !rangeEndAdjusted) {
    throw new ApiError(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Unprocessable entity',
      `ISBN range id ${id} range_begin and range_edit would not have been adjusted. Refusing to process noop.`,
    );
  }

  // Find potential conflicts with other ranges that what is being processed
  const conflictingIsbnRanges = await getIsbnRangeConflict(proposedRangeEdit);
  const filteredConflictingIsbnRanges = conflictingIsbnRanges.filter((isbnRange) => isbnRange.id !== currentRange.id);

  if (filteredConflictingIsbnRanges.length > 0) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `ISBN range cannot be created due to conflict between existing ISBN ranges (ids: ${filteredConflictingIsbnRanges.map(({ id }) => id).join(', ')})`,
    );
  }

  // TODO: verify existing publisher ranges do not conflict with range adjustment (e.g., publisher ranges may not exist for given range)
  const db = getKysely();
  await db
    .updateTable('isbn_range')
    .set({
      range_begin,
      range_end,
      modified_by: user.id,
      modified: getCurrentTime(),
    })
    .where('id', '=', id)
    .executeTakeFirstOrThrow();

  return;
}
