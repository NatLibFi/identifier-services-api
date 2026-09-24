import HttpStatus from 'http-status';

import { getKysely } from '../../db/database.ts';
import { ApiError } from '../../utils/api-error.ts';
import { getCurrentTime, validateRowsUpdatedExact } from '../shared-interface-utils.ts';

import type { IssnIdentifierSelect, IssnIdentifierUpdate } from '../../db/types/serial/types-isnn-identifier.ts';
import type { Database } from '../../db/types.ts';
import type { Transaction } from 'kysely';
import type { RequestUser } from '../../generic-types.ts';
import type { IssnRangeUpdate } from '../../db/types/serial/types-issn-range.ts';
import type { SerialPublicationAdminRead } from '../../dtl/serial/serial-publication-dtl.ts';
import { SERIAL_PUBLICATION_STATUS } from '../../constants.ts';

// Old API code
export function calculateCheckDigitIssn(issnWithoutCheckDigit: string): string {
  // Remove dash if there is one
  const formattedIssnWithoutCheckDigit = issnWithoutCheckDigit.replace('-', '');

  // Validate issn consists now from seven digits
  if (!/^[0-9]{7}$/.test(formattedIssnWithoutCheckDigit)) {
    throw new Error('Cannot generate issn check digit for invalid input');
  }

  let sumOfDigits = 0;

  for (let i = 0; i < formattedIssnWithoutCheckDigit.length; i++) {
    sumOfDigits += Number(formattedIssnWithoutCheckDigit.charAt(i)) * (8 - i);
  }

  const checkDigit = (11 - (sumOfDigits % 11)) % 11;

  // Validate that the value is sane
  if (isNaN(checkDigit) || checkDigit < 0 || checkDigit > 10) {
    throw new Error('Check digit generation has generated an invalid check digit');
  }

  return checkDigit === 10 ? 'X' : checkDigit.toString();
}

export async function getSerialPublicationIssnIdentifier(
  serialPublicationId: number,
  trx?: Transaction<Database>,
): Promise<IssnIdentifierSelect | null> {
  // Use transaction if provided
  const db = trx ? trx : getKysely();

  const dbResult = await db
    .selectFrom('issn_identifier')
    .selectAll()
    .where('serial_publication_id', '=', serialPublicationId)
    .execute();

  const issnIdentifier = dbResult[0];

  if (dbResult.length === 0 || !issnIdentifier) {
    return null;
  }

  if (dbResult.length > 1) {
    throw new ApiError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Internal server error',
      `Serial publication id ${serialPublicationId} is associated with ${dbResult.length} ISSN identifiers. This should not happen. Please notify system administrators.`,
    );
  }

  return issnIdentifier;
}

// By default uses the current active range - if system works correctly only one range should be active
// Note: this interface does not process serial publication or serial publication request states
export async function assignIssnIdentifier(publicationId: number, user: RequestUser, trx?: Transaction<Database>) {
  // Use transaction if provided, otherwise fallback to controlled transaction
  const controlledTransaction = trx ? null : await getKysely().startTransaction().execute();
  const transaction = trx ? trx : controlledTransaction;

  // Sanity check for typing
  if (!transaction) {
    throw new Error(
      'For some reason, transaction was not defined. This should not ever happen and code branch exists purely for satisfying typing requirements.',
    );
  }

  try {
    // Find and validate ISSN range to be used
    const issnRangeResult = await transaction.selectFrom('issn_range').selectAll().where('active', '=', true).execute();
    const validatedIssnRange = issnRangeResult[0];
    if (issnRangeResult.length === 0 || !validatedIssnRange) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Not found', 'Active ISSN range entry could not be found.');
    }

    if (issnRangeResult.length > 1) {
      throw new ApiError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
        'Found multiple active ISSN ranges. Refusing to process.',
      );
    }

    // Find and validate ISSN identifier to be used
    const nextFreeIssnIdentifier = await transaction
      .selectFrom('issn_identifier')
      .select(['id', 'serial_publication_id', 'identifier'])
      .where('issn_range_id', '=', validatedIssnRange.id)
      .where('serial_publication_id', 'is', null)
      .orderBy('id', 'asc') // Use identifiers in order
      .limit(1)
      .execute();

    const validatedIssnIdentifier = nextFreeIssnIdentifier[0];

    if (nextFreeIssnIdentifier.length === 0 || !validatedIssnIdentifier) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Not found', 'Available free ISSN identifier entry could not be found.');
    }

    if (nextFreeIssnIdentifier.length > 1) {
      throw new ApiError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
        'Database query resulted into multiple ISSN identifiers. This should not happen. Refusing to process.',
      );
    }

    // Sanity check - should always be covered by db query!
    if (validatedIssnIdentifier.serial_publication_id) {
      throw new ApiError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
        `ISSN identifier ${validatedIssnIdentifier.identifier} (id: ${validatedIssnIdentifier.id}) data was corrupted and it couldn't be associated with publication. Please notify system administrator.`,
      );
    }

    // Assign the identifier - done in separate step for purpose of having more robust struct to functionality
    const issnIdentifierDbUpdate: IssnIdentifierUpdate = {
      serial_publication_id: publicationId,
      modified: getCurrentTime(),
      modified_by: user.id,
    };

    const issnIdentifierUpdateResult = await transaction
      .updateTable('issn_identifier')
      .set(issnIdentifierDbUpdate)
      .where('id', '=', validatedIssnIdentifier.id)
      .where('serial_publication_id', 'is', null)
      .executeTakeFirstOrThrow();

    validateRowsUpdatedExact(issnIdentifierUpdateResult, 1);

    // Check whether range needs to be deactivated
    const { count_free_issn } = await transaction
      .selectFrom('issn_identifier')
      .select([transaction.fn.countAll<number>().as('count_free_issn')])
      .where('issn_range_id', '=', validatedIssnRange.id)
      .where('serial_publication_id', 'is', null)
      .executeTakeFirstOrThrow();

    if (count_free_issn === 0) {
      const issnRangeDbUpdate: IssnRangeUpdate = {
        active: false,
        modified: getCurrentTime(),
        modified_by: user.id,
      };

      const issnRangeUpdateResult = await transaction
        .updateTable('issn_range')
        .set(issnRangeDbUpdate)
        .where('id', '=', validatedIssnRange.id)
        .executeTakeFirstOrThrow();
      validateRowsUpdatedExact(issnRangeUpdateResult, 1);
    }

    if (controlledTransaction) {
      await controlledTransaction.commit().execute();
    }
  } catch (error) {
    // In case transaction was not provided, controlled transaction needs to be rollbacked manually
    if (controlledTransaction) {
      await controlledTransaction.rollback().execute();
    }

    throw error;
  }
}

// Note: deassigning process does not automatically re-activate ISSN range the identifier belongs to
// Note: this interface does not process serial publication or serial publication request states
export async function revokeIssnIdentifier(
  publication: SerialPublicationAdminRead,
  user: RequestUser,
  trx?: Transaction<Database>,
) {
  // Never allow deassignation for publications with status ISSN_FROZEN!
  if (publication.status === SERIAL_PUBLICATION_STATUS.ISSN_FROZEN) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Serial publication id ${publication.id} has explicitly been placed into a state that disallows deassigning ISSN identifier. Refusing to cooperate with request!`,
    );
  }

  // Use transaction if provided, otherwise fallback to controlled transaction
  const controlledTransaction = trx ? null : await getKysely().startTransaction().execute();
  const transaction = trx ? trx : controlledTransaction;

  // Sanity check for typing
  if (!transaction) {
    throw new Error(
      'For some reason, transaction was not defined. This should not ever happen and code branch exists purely for satisfying typing requirements.',
    );
  }

  try {
    const issnIdentifierDbUpdate: IssnIdentifierUpdate = {
      serial_publication_id: null,
      modified: getCurrentTime(),
      modified_by: user.id,
    };

    const issnIdentifierUpdateResult = await transaction
      .updateTable('issn_identifier')
      .set(issnIdentifierDbUpdate)
      .where('serial_publication_id', '=', publication.id)
      .executeTakeFirstOrThrow();

    validateRowsUpdatedExact(issnIdentifierUpdateResult, 1);

    if (controlledTransaction) {
      await controlledTransaction.commit().execute();
    }
  } catch (error) {
    // In case transaction was not provided, controlled transaction needs to be rollbacked manually
    if (controlledTransaction) {
      await controlledTransaction.rollback().execute();
    }

    throw error;
  }
}
