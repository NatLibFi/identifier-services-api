import HttpStatus from 'http-status';

import { ApiError } from '../../utils/api-error.ts';
import { getKysely } from '../../db/database.ts';
import {
  getAllIsmnPublisherRanges,
  getAvailableIsmnPublisherRanges,
  getIsmnRangeConflict,
} from './ismn-range-interface-utils.ts';
import { getCurrentTime, validateGetById } from '../interface-utils/common-interface-utils.ts';
import { asIsmnRangeAdminRead, type IsmnRangeRead } from '../../dtl/monograph/ismn-range-dtl.ts';

import type { IsmnRangeSelect } from '../../db/types/monograph/types-ismn-range.ts';
import type { CreateIsmnRangeHttp, UpdateIsmnRangeHttp } from '../../validations/monograph/ismn-range-validation.ts';
import type { CreatedResponse } from '../interface-common-types.ts';
import type { RequestUser } from '../../generic-types.ts';
import { ISMN_VALID_GS1, ISMN_VALID_REGISTRATION_GROUPS } from '../../constants/monograph/ismn-constants.ts';

export async function getIsmnRanges() {
  const db = getKysely();
  const result = await db.selectFrom('ismn_range').selectAll().execute();

  return await Promise.all(
    result.map(async (r) => {
      const total = getAllIsmnPublisherRanges(r).length;
      const { taken } = await db
        .selectFrom('ismn_publisher_range')
        .select(db.fn.countAll<number>().as('taken'))
        .where('ismn_range_id', '=', r.id)
        .executeTakeFirstOrThrow();

      // DTL confirms base attributes which are then extended
      return {
        ...asIsmnRangeAdminRead(r),
        free: total - taken,
        taken,
      };
    }),
  );
}

export async function createIsmnRange(
  ismnRangeCreateDoc: CreateIsmnRangeHttp,
  user: RequestUser,
): Promise<CreatedResponse> {
  const conflictingIsmnRanges = await getIsmnRangeConflict(ismnRangeCreateDoc);

  if (conflictingIsmnRanges.length > 0) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `ISMN range cannot be created due to conflict between existing ISMN ranges (ids: ${conflictingIsmnRanges.map(({ id }) => id).join(', ')})`,
    );
  }

  const { gs1, registration_group, range_begin, range_end } = ismnRangeCreateDoc;

  // Sanity check for ISMN gs1 and registration_group even though API validation should always take care of these
  if (gs1 !== ISMN_VALID_GS1['979']) {
    throw new ApiError(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Unprocessable entity',
      `ISMN range cannot have other gs1 definition than ${ISMN_VALID_GS1['979']}`,
    );
  }

  if (registration_group !== ISMN_VALID_REGISTRATION_GROUPS['0']) {
    throw new ApiError(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Unprocessable entity',
      `ISMN range cannot have other registration_group definition than ${ISMN_VALID_REGISTRATION_GROUPS['0']}`,
    );
  }

  const db = getKysely();

  const result = await db
    .insertInto('ismn_range')
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

export async function readIsmnRange(id: number): Promise<IsmnRangeRead> {
  const db = getKysely();
  const dbResult = await db.selectFrom('ismn_range').selectAll().where('id', '=', id).execute();

  const ismnRangeResult = validateGetById<IsmnRangeSelect>(dbResult);
  const availablePublisherRanges = await getAvailableIsmnPublisherRanges(ismnRangeResult);

  return {
    ...asIsmnRangeAdminRead(ismnRangeResult),
    available_publisher_ranges: availablePublisherRanges,
  };
}

export async function updateIsmnRange(id: number, ismnRangeUpdateDoc: UpdateIsmnRangeHttp, user: RequestUser) {
  const { active, range_begin, range_end } = ismnRangeUpdateDoc;

  // Process update depending on its type
  if (active !== undefined) {
    await processIsmnRangeActiveEdit(id, active, user);
  } else {
    await processIsmnRangeEdit(id, range_begin, range_end, user);
  }

  return;
}

export async function deleteIsmnRange(id: number) {
  const db = getKysely();

  // Read to confirm range exists - this will also take care of returning 404
  await readIsmnRange(id);

  const { count: numAssociatedPublisherRanges } = await db
    .selectFrom('ismn_publisher_range')
    .select(db.fn.countAll<number>().as('count'))
    .where('ismn_range_id', '=', id)
    .executeTakeFirstOrThrow();

  if (numAssociatedPublisherRanges !== 0) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `ISMN range id ${id} has ${numAssociatedPublisherRanges} associated ISMN publisher ranges.`,
    );
  }

  await db.deleteFrom('ismn_range').where('id', '=', id).executeTakeFirstOrThrow();

  return;
}

export async function processIsmnRangeActiveEdit(id: number, active: boolean, user: RequestUser) {
  const currentRange = await readIsmnRange(id);

  const noStateChange =
    (active === true && currentRange.active === true) || (active === false && currentRange.active === false);

  if (noStateChange) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `ISMN range id ${currentRange.id} has already active=${active}`,
    );
  }

  if (active && currentRange.available_publisher_ranges.length === 0) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Cannot activate ISMN range id ${currentRange.id} as it does not have any more available ISMN publisher ranges.`,
    );
  }

  const db = getKysely();
  await db
    .updateTable('ismn_range')
    .set({
      active,
      modified_by: user.id,
      modified: getCurrentTime(),
    })
    .where('id', '=', currentRange.id)
    .executeTakeFirstOrThrow();

  return;
}

export async function processIsmnRangeEdit(
  id: number,
  range_begin: string | undefined,
  range_end: string | undefined,
  user: RequestUser,
) {
  const currentRange = await readIsmnRange(id);

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
      `ISMN range id ${id} range_begin and range_edit would not have been adjusted. Refusing to process noop.`,
    );
  }

  // Find potential conflicts with other ranges that what is being processed
  const conflictingIsmnRanges = await getIsmnRangeConflict(proposedRangeEdit);
  const filteredConflictingIsmnRanges = conflictingIsmnRanges.filter((ismnRange) => ismnRange.id !== currentRange.id);

  if (filteredConflictingIsmnRanges.length > 0) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `ISMN range cannot be created due to conflict between existing ISMN ranges (ids: ${filteredConflictingIsmnRanges.map(({ id }) => id).join(', ')})`,
    );
  }

  const db = getKysely();
  await db
    .updateTable('ismn_range')
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
