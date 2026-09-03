import HttpStatus from 'http-status';

import { readIssnRange } from './issn-range-interface.ts';

import { ApiError } from '../../utils/api-error.ts';

import { getKysely } from '../../db/database.ts';
import { testRangeOverlap } from '../monograph/monograph-range-utils.ts';
import { calculateCheckDigitIssn } from './issn-identifier-utils.ts';
import { getCurrentTime, validateRowsInserted, validateRowsUpdatedExact } from '../shared-interface-utils.ts';

import type { IssnRangeSelect } from '../../db/types/serial/types-issn-range.ts';
import type { CreateIssnRangeHttp } from '../../validations/serial/issn-range-validation.ts';
import type { Transaction } from 'kysely';
import type { IssnIdentifierInsert } from '../../db/types/serial/types-isnn-identifier.ts';
import type { RequestUser } from '../../generic-types.ts';
import type { Database } from '../../db/types.ts';

export async function getIssnRangeConflict(issnRangeCreateDoc: CreateIssnRangeHttp): Promise<IssnRangeSelect[]> {
  const db = getKysely();

  const rangeBeginAsNum = Number(issnRangeCreateDoc.range_begin);
  const rangeEndAsNum = Number(issnRangeCreateDoc.range_end);

  const createDocCompareInput = { rangeBegin: rangeBeginAsNum, rangeEnd: rangeEndAsNum };

  const entriesWithSharedBlock: IssnRangeSelect[] = await db
    .selectFrom('issn_range')
    .selectAll()
    .where('block', '=', issnRangeCreateDoc.block)
    .execute();

  return entriesWithSharedBlock.filter((e) => {
    const compareStartNumber = Number(e.range_begin);
    const compareEndNumber = Number(e.range_end);
    const compare = {
      rangeBegin: compareStartNumber,
      rangeEnd: compareEndNumber,
    };

    return testRangeOverlap(createDocCompareInput, compare);
  });
}

export async function createIssnRangeIdentifiers(
  issnRangeCreateDoc: CreateIssnRangeHttp,
  issnRangeId: number,
  user: RequestUser,
  trx: Transaction<Database>,
): Promise<void> {
  const beginAsNumber = Number(issnRangeCreateDoc.range_begin);
  const endAsNumber = Number(issnRangeCreateDoc.range_end);

  const issnIdentifiers: IssnIdentifierInsert[] = [];

  for (let i = beginAsNumber; i <= endAsNumber; i++) {
    const paddedItemNumber = `${i}`.padStart(3, '0');
    const checkDigit = calculateCheckDigitIssn(`${issnRangeCreateDoc.block}${paddedItemNumber}`);
    const issnIdentifier = `${issnRangeCreateDoc.block}-${paddedItemNumber}${checkDigit}`;

    issnIdentifiers.push({
      issn_range_id: issnRangeId,
      serial_publication_id: null,
      identifier: issnIdentifier,
      created: getCurrentTime(),
      created_by: user.id,
      modified: getCurrentTime(),
      modified_by: user.id,
    });
  }

  const result = await trx.insertInto('issn_identifier').values(issnIdentifiers).executeTakeFirstOrThrow();
  const expectedNumInserted = endAsNumber - beginAsNumber + 1;
  validateRowsInserted(result, expectedNumInserted);
}

export async function processIssnRangeActiveEdit(id: number, active: boolean, user: RequestUser) {
  const currentRange = await readIssnRange(id);

  const noStateChange =
    (active === true && currentRange.active === true) || (active === false && currentRange.active === false);

  if (noStateChange) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `ISSN range id ${currentRange.id} has already active=${active}`,
    );
  }

  if (active && currentRange.free === 0) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Cannot activate ISSN range id ${currentRange.id} as it does not have any more available ISSN identifiers.`,
    );
  }

  // Only one ISSN range may be active at any given time
  const db = getKysely();

  await db.transaction().execute(async (trx) => {
    // Deactivate all other ISSN ranges if range will be activated
    if (active) {
      await trx
        .updateTable('issn_range')
        .set({ active: false, modified_by: user.id, modified: getCurrentTime() })
        .where('active', '=', true)
        .execute();
    }

    const rangeUpdateResult = await trx
      .updateTable('issn_range')
      .set({
        active,
        modified_by: user.id,
        modified: getCurrentTime(),
      })
      .where('id', '=', currentRange.id)
      .executeTakeFirstOrThrow();

    validateRowsUpdatedExact(rangeUpdateResult, 1);
  });

  return;
}
