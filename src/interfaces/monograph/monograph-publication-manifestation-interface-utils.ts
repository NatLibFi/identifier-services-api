import HttpStatus from 'http-status';

import { getKysely } from '../../db/database.ts';
import { isAdmin } from '../../utils/permission-utils.ts';

import type { RequestUser } from '../../generic-types.ts';
import { ApiError } from '../../utils/api-error.ts';

// Verifies that if administrator adds manifestation, it must have a proper monograph_publication_request_id defined
export async function validateAddManifestationRequest(
  user: RequestUser,
  insertMonographPublicationId: number,
  insertMonographPublicationRequestId: number | null | undefined,
) {
  // This check considers only admin users who add manifestations
  // Authorizing operation to publisher users must be checked elsewhere
  if (!isAdmin(user)) {
    return;
  }

  if (!insertMonographPublicationRequestId) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      'Administrators cannot add manifestation that is not related to a monograph publication request.',
    );
  }

  const db = getKysely();
  const monographPublicationRequests = await db
    .selectFrom('monograph_publication_request')
    .select('id')
    .where('monograph_publication_id', '=', insertMonographPublicationId)
    .execute();

  // For TS to be happy
  const [monographPublicationRequest] = monographPublicationRequests;

  if (!monographPublicationRequest || monographPublicationRequests.length === 0) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      'Administrators cannot add manifestation that is not related to a monograph publication request.',
    );
  }

  if (monographPublicationRequests.length > 1) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      'Given monograph publication belongs into many request. This should not ever happen. Please contact system administrator.',
    );
  }

  if (monographPublicationRequest.id !== insertMonographPublicationRequestId) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      'Given monograph publication belongs to different request the manifestation was attempted to be associated with.',
    );
  }

  return;
}
