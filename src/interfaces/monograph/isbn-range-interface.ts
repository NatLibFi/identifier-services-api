import HttpStatus from 'http-status';

import { ApiError } from '../../utils/api-error.ts';
import { getKysely } from '../../db/database.ts';
import { getIsbnRangeConflict } from './isbn-range-interface-utils.ts';

import type { IsbnRangeRead } from '../../db/types/monograph/types-isbn-range.ts';
import type { CreateIsbnRangeHttp } from '../../validations/monograph/isbn-range-validation.ts';
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
  // TODO: add dynamic "free" attribute
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
  const conflictingIsbnRange = await getIsbnRangeConflict(isbnRangeCreateDoc);

  if (conflictingIsbnRange !== undefined) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `ISBN range cannot be created due to conflict between existing ISBN range id ${conflictingIsbnRange.id}`,
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
      created: new Date(),
      created_by: user.id,
      modified: new Date(),
      modified_by: user.id,
    })
    .executeTakeFirstOrThrow();

  return { id: Number(result.insertId) };
}
