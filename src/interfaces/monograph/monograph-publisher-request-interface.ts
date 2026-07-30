import {
  getDbPublisherRequestArchiveEntry,
  getDbPublisherRequestEntry,
} from './monograph-publisher-request-interface-utils.ts';

import { getKysely } from '../../db/database.ts';
import { getCurrentTime, removeUndefinedProperties, validateGetById } from '../shared-interface-utils.ts';

import {
  asMonographPublisherRequestAdminRead,
  asMonographPublisherRequestSearchResult,
} from '../../dtl/monograph/monograph-publisher-request-dtl.ts';

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
import type { MonographPublisherInsert } from '../../db/types/monograph/types-monograph-publisher.ts';
import type { RequestUser } from '../../generic-types.ts';

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

  // Read to confirm monograph publisher request exists - this will also take care of returning 404
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

  const countQuery = query.clearSelect().select((eb) => eb.fn.countAll<number>().as('total_doc'));
  query = query.orderBy('id', 'desc').limit(limit).offset(offset);

  const result = await query.execute();
  const { total_doc } = await countQuery.executeTakeFirstOrThrow();

  return {
    total_doc,
    results: result.map(asMonographPublisherRequestSearchResult),
  };
}

export async function approveMonographPublisherRequest(monographPublisherRequestId: number, user: RequestUser) {
  const db = getKysely();

  // Read to confirm monograph publisher request exists - this will also take care of returning 404
  const monographPublisherRequest = await readMonographPublisherRequest(monographPublisherRequestId);

  // Construct publisher registry entry
  const monographPublisherRegistryEntry: MonographPublisherInsert = {
    official_name: monographPublisherRequest.official_name,
    other_names: JSON.stringify(monographPublisherRequest.other_names),
    previous_names: JSON.stringify([]),
    address: monographPublisherRequest.address,
    zip: monographPublisherRequest.zip,
    city: monographPublisherRequest.city,
    phone: monographPublisherRequest.phone,
    email: monographPublisherRequest.email,
    www: monographPublisherRequest.www,
    lang_code: monographPublisherRequest.lang_code,
    contact_persons: JSON.stringify(monographPublisherRequest.contact_persons),
    additional_info: monographPublisherRequest.additional_info,
    year_quitted: null,
    has_quitted: false,
    frequency_current: monographPublisherRequest.frequency_current,
    frequency_next: monographPublisherRequest.frequency_next,
    affiliate_of: monographPublisherRequest.affiliate_of,
    affiliates: monographPublisherRequest.affiliates,
    distributor_of: monographPublisherRequest.distributor_of,
    distributors: monographPublisherRequest.distributors,
    classifications: JSON.stringify(monographPublisherRequest.classifications),
    classification_other: monographPublisherRequest.classification_other,
    promote_sorting: false,
    created: getCurrentTime(),
    created_by: user.id,
    modified: getCurrentTime(),
    modified_by: user.id,
  };

  // Update within transaction to simulatenously update archive entry association
  const resultId = await db.transaction().execute(async (trx) => {
    // 1. Insert entry to monograph_publisher table
    const { insertId } = await trx
      .insertInto('monograph_publisher')
      .values(monographPublisherRegistryEntry)
      .executeTakeFirstOrThrow();

    const publisherId = Number(insertId);

    // 2. Change archive entry association
    const archiveEntryUpdate = await trx
      .updateTable('monograph_publisher_request_archive')
      .set({
        monograph_publisher_request_id: null,
        monograph_publisher_id: publisherId,
      })
      .where('monograph_publisher_request_id', '=', monographPublisherRequestId)
      .executeTakeFirstOrThrow();

    if (Number(archiveEntryUpdate.numChangedRows) !== 1) {
      throw new Error('Update unexpectedly changed more than one row');
    }

    // 3. Remove entry from request table
    const requestDelete = await trx
      .deleteFrom('monograph_publisher_request')
      .where('id', '=', monographPublisherRequestId)
      .executeTakeFirstOrThrow();

    if (Number(requestDelete.numDeletedRows) !== 1) {
      throw new Error('Update unexpectedly changed more than one row');
    }

    return publisherId;
  });

  return { monograph_publisher_id: resultId };
}

export async function deleteMonographPublisherRequest(monographPublisherRequestId: number) {
  const db = getKysely();

  // Utilize read to confirm monograph publisher request exists - this will also take care of returning 404
  await readMonographPublisherRequest(monographPublisherRequestId);

  // Delete within transaction to simulatenously remove archive entry
  await db.transaction().execute(async (trx) => {
    // 1. Remove archive entry
    const archiveEntryUpdate = await trx
      .deleteFrom('monograph_publisher_request_archive')
      .where('monograph_publisher_request_id', '=', monographPublisherRequestId)
      .where('monograph_publisher_id', 'is', null)
      .executeTakeFirstOrThrow();

    if (Number(archiveEntryUpdate.numDeletedRows) !== 1) {
      throw new Error(
        'Removal unexpectedly affected more or less than exactly one row in monograph_publisher_request_archive table',
      );
    }

    // 2. Remove entry from request table
    const requestDelete = await trx
      .deleteFrom('monograph_publisher_request')
      .where('id', '=', monographPublisherRequestId)
      .executeTakeFirstOrThrow();

    if (Number(requestDelete.numDeletedRows) !== 1) {
      throw new Error(
        'Removal unexpectedly affected more or less than exactly one row in monograph_publisher_request table',
      );
    }

    return;
  });

  return;
}
