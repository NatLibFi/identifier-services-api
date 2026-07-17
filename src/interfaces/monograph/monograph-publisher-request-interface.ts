import {
  getDbPublisherRequestArchiveEntry,
  getDbPublisherRequestEntry,
} from './monograph-publisher-request-interface-utils.ts';

import type { RequestUser } from '../../generic-types.ts';
import type {
  CreateMonographPublisherRequestV1Http,
  CreateMonographPublisherRequestV2Http,
} from '../../validations/monograph/monograph-publisher-request-validation.ts';
import type { CreatedResponse } from '../interface-common-types.ts';

import { getKysely } from '../../db/database.ts';

export async function createMonographPublisherRequest(
  createDoc: CreateMonographPublisherRequestV1Http | CreateMonographPublisherRequestV2Http,
  user: RequestUser,
): Promise<CreatedResponse> {
  const publisherRequest = getDbPublisherRequestEntry(createDoc, user);
  const db = getKysely();

  const resultId = await db.transaction().execute(async (trx) => {
    // 1. Create publisher request
    const publisherRequestResult = await trx
      .insertInto('monograph_publisher_request')
      .values(publisherRequest)
      .executeTakeFirstOrThrow();

    const publisherRequestId = Number(publisherRequestResult.insertId);

    // 2. Create archive entry attached to the request
    await trx
      .insertInto('monograph_publisher_request_archive')
      .values(getDbPublisherRequestArchiveEntry(publisherRequest, publisherRequestId))
      .executeTakeFirstOrThrow();

    return publisherRequestId;
  });

  return { id: resultId };
}
