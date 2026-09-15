import HttpStatus from 'http-status';

import { getKysely } from '../../db/database.ts';
import { ApiError } from '../../utils/api-error.ts';

import type { IssnIdentifierSelect } from '../../db/types/serial/types-isnn-identifier.ts';
import type { Database } from '../../db/types.ts';
import type { Transaction } from 'kysely';

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
