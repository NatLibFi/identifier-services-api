import {
  getDbPublisherRequestArchiveEntry,
  getDbPublisherRequestEntry,
} from './monograph-publisher-request-interface-utils.ts';

import { getKysely } from '../../db/database.ts';
import {
  getCurrentTime,
  removeUndefinedProperties,
  validateGetById,
} from '../interface-utils/common-interface-utils.ts';

import {
  asMonographPublisherRequestAdminRead,
  asMonographPublisherRequestSearchResult,
} from '../../dtl/monograph/monograph-publisher-request-dtl.ts';

import type { RequestUser } from '../../generic-types.ts';
import type {
  CreateMonographPublisherRequestV1Http,
  CreateMonographPublisherRequestV2Http,
  SearchMonographPublisherRequestHttp,
  UpdateMonographPublisherRequestHttp,
} from '../../validations/monograph/monograph-publisher-request-validation.ts';
import type {
  MonographPublisherRequestSelect,
  MonographPublisherRequestUpdate,
} from '../../db/types/monograph/types-monograph-publisher-request.ts';

export async function createMonographPublisherRequest(
  createDoc: CreateMonographPublisherRequestV1Http | CreateMonographPublisherRequestV2Http,
  user: RequestUser,
): Promise<void> {
  const publisherRequest = getDbPublisherRequestEntry(createDoc, user);
  const db = getKysely();

  await db.transaction().execute(async (trx) => {
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

  return;
}

export async function readMonographPublisherRequest(monographPublisherRequestId: number) {
  const db = getKysely();
  const dbResult = await db
    .selectFrom('monograph_publisher_request')
    .selectAll()
    .where('id', '=', monographPublisherRequestId)
    .execute();
  const monographPublisherResult = validateGetById<MonographPublisherRequestSelect>(dbResult);

  return asMonographPublisherRequestAdminRead(monographPublisherResult);
}

export async function updateMonographPublisherRequest(
  monographPublisherRequestId: number,
  monographPublisherUpdateDoc: UpdateMonographPublisherRequestHttp,
  user: RequestUser,
) {
  const db = getKysely();

  // Read to confirm monograph publisher exists - this will also take care of returning 404
  await readMonographPublisherRequest(monographPublisherRequestId);

  // Update
  const {
    official_name,
    other_names,
    address,
    zip,
    city,
    phone,
    email,
    www,
    lang_code,
    contact_persons,
    additional_info,
    frequency_current,
    frequency_next,
    affiliate_of,
    affiliates,
    distributor_of,
    distributors,
    classifications,
    classification_other,
  } = monographPublisherUpdateDoc;

  const monographPublisherUpdateValues = {
    official_name,
    other_names: other_names ? JSON.stringify(other_names) : undefined,
    address,
    zip,
    city,
    phone,
    email,
    www,
    lang_code,
    contact_persons: contact_persons ? JSON.stringify(contact_persons) : undefined,
    additional_info,
    frequency_current,
    frequency_next,
    affiliate_of,
    affiliates,
    distributor_of,
    distributors,
    classifications: classifications ? JSON.stringify(classifications) : undefined,
    classification_other,
    modified: getCurrentTime(),
    modified_by: user.id,
  };

  const dbUpdateValues = removeUndefinedProperties<MonographPublisherRequestUpdate>(monographPublisherUpdateValues);

  // Update within transaction to guarantee change of one row only
  await db.transaction().execute(async (trx) => {
    const { numChangedRows } = await trx
      .updateTable('monograph_publisher_request')
      .set(dbUpdateValues)
      .where('id', '=', monographPublisherRequestId)
      .executeTakeFirstOrThrow();

    if (Number(numChangedRows) !== 1) {
      throw new Error('Update unexpectedly changed more than one row');
    }
  });

  return;
}

export async function searchMonographPublisherRequest(searchParameters: SearchMonographPublisherRequestHttp) {
  const { search_text, limit, offset } = searchParameters;

  const db = getKysely();

  let query = db.selectFrom('monograph_publisher_request').selectAll();

  if (search_text) {
    const normalizedSearch = `%${search_text}%`.toLowerCase();

    query = query.where((eb) =>
      eb.or([
        eb(eb.fn('lower', ['monograph_publisher_request.official_name']), 'like', normalizedSearch),
        eb(eb.fn('lower', ['monograph_publisher_request.email']), 'like', normalizedSearch),
        eb(eb.fn('lower', ['monograph_publisher_request.additional_info']), 'like', normalizedSearch),
      ]),
    );
  }

  const countQuery = query.clearSelect().select((eb) => eb.fn.countAll<number>().as('totalDoc'));
  query = query.orderBy('id', 'desc').limit(limit).offset(offset);

  const result = await query.execute();
  const { totalDoc } = await countQuery.executeTakeFirstOrThrow();

  return {
    totalDoc,
    results: result.map(asMonographPublisherRequestSearchResult),
  };
}
