import { getKysely } from '../../db/database.ts';
import { hasAdminApplicationRole } from '../../middlewares/auth.ts';
import {
  constructTextLikeSearch,
  getCurrentTime,
  removeUndefinedProperties,
  validateGetById,
} from '../interface-utils/common-interface-utils.ts';
import {
  asMonographPublisherAdminRead,
  asMonographPublisherGuestRead,
} from '../../dtl/monograph/monograph-publisher-dtl.ts';

import type {
  MonographPublisherSelect,
  MonographPublisherUpdate,
} from '../../db/types/monograph/types-monograph-publisher.ts';

import type {
  CreateMonographPublisherHttp,
  SearchMonographPublisherHttp,
  UpdateMonographPublisherHttp,
} from '../../validations/monograph/monograph-publisher-validation.ts';
import type { RequestUser } from '../../generic-types.ts';
import type { CreatedResponse } from '../interface-common-types.ts';
import { STRINGIFIED_EMPTY_ARRAY } from '../../constants.ts';
import { isAdmin } from '../../utils/permission-utils.ts';

export async function createMonographPublisher(
  monographPublisherCreateDoc: CreateMonographPublisherHttp,
  user: RequestUser,
): Promise<CreatedResponse> {
  const {
    official_name,
    other_names,
    previous_names,
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
  } = monographPublisherCreateDoc;

  const db = getKysely();

  const result = await db
    .insertInto('monograph_publisher')
    .values({
      official_name,
      other_names: other_names ? JSON.stringify(other_names) : STRINGIFIED_EMPTY_ARRAY,
      previous_names: previous_names ? JSON.stringify(previous_names) : STRINGIFIED_EMPTY_ARRAY,
      address: address ?? null,
      zip: zip ?? null,
      city: city ?? null,
      phone: phone ?? null,
      email: email ?? null,
      www: www ?? null,
      lang_code,
      contact_persons: contact_persons ? JSON.stringify(contact_persons) : STRINGIFIED_EMPTY_ARRAY,
      additional_info: additional_info ?? null,
      year_quitted: null,
      has_quitted: false,
      frequency_current: frequency_current ?? null,
      frequency_next: frequency_next ?? null,
      affiliate_of: affiliate_of ?? null,
      affiliates: affiliates ?? null,
      distributor_of: distributor_of ?? null,
      distributors: distributors ?? null,
      classifications: classifications ? JSON.stringify(classifications) : STRINGIFIED_EMPTY_ARRAY,
      classification_other: classification_other ?? null,
      promote_sorting: false,
      created: getCurrentTime(),
      created_by: user.id,
      modified: getCurrentTime(),
      modified_by: user.id,
    })
    .executeTakeFirstOrThrow();

  return { id: Number(result.insertId) };
}

export async function readMonographPublisher(id: number, user?: RequestUser, useDtl = true) {
  const db = getKysely();
  const dbResult = await db.selectFrom('monograph_publisher').selectAll().where('id', '=', id).execute();
  const monographPublisherResult = validateGetById<MonographPublisherSelect>(dbResult);

  if (!useDtl) {
    return monographPublisherResult;
  }

  const isAdmin = hasAdminApplicationRole(user?.applicationRoles);
  if (isAdmin) {
    return asMonographPublisherAdminRead(monographPublisherResult);
  }

  return asMonographPublisherGuestRead(monographPublisherResult);
}

export async function deleteMonographPublisher(id: number) {
  const db = getKysely();

  // Read to confirm range exists - this will also take care of returning 404
  await readMonographPublisher(id);

  // TODO: constraints related to associations
  await db.deleteFrom('monograph_publisher').where('id', '=', id).executeTakeFirstOrThrow();

  return;
}

export async function updateMonographPublisher(
  id: number,
  monographPublisherUpdateDoc: UpdateMonographPublisherHttp,
  user: RequestUser,
) {
  const db = getKysely();

  // Read to confirm monograph publisher exists - this will also take care of returning 404
  await readMonographPublisher(id);

  // Update
  const {
    official_name,
    other_names,
    previous_names,
    address,
    zip,
    city,
    phone,
    email,
    www,
    lang_code,
    contact_persons,
    additional_info,
    year_quitted,
    has_quitted,
    frequency_current,
    frequency_next,
    affiliate_of,
    affiliates,
    distributor_of,
    distributors,
    classifications,
    classification_other,
    promote_sorting,
  } = monographPublisherUpdateDoc;

  const monographPublisherUpdateValues = {
    official_name,
    other_names: other_names ? JSON.stringify(other_names) : undefined,
    previous_names: previous_names ? JSON.stringify(previous_names) : undefined,
    address,
    zip,
    city,
    phone,
    email,
    www,
    lang_code,
    contact_persons: contact_persons ? JSON.stringify(contact_persons) : undefined,
    additional_info,
    year_quitted,
    has_quitted,
    frequency_current,
    frequency_next,
    affiliate_of,
    affiliates,
    distributor_of,
    distributors,
    classifications: classifications ? JSON.stringify(classifications) : undefined,
    classification_other,
    promote_sorting,
    modified: getCurrentTime(),
    modified_by: user.id,
  };

  const dbUpdateValues = removeUndefinedProperties<MonographPublisherUpdate>(monographPublisherUpdateValues);

  // Update within transaction to guarantee change of one row only
  await db.transaction().execute(async (trx) => {
    const { numChangedRows } = await trx
      .updateTable('monograph_publisher')
      .set(dbUpdateValues)
      .where('id', '=', id)
      .executeTakeFirstOrThrow();

    if (Number(numChangedRows) !== 1) {
      throw new Error('Update unexpectedly changed more than one row');
    }
  });

  // Use consistent return value between processing. This will be one additional read as overhead, but currently it's acceptable.
  return readMonographPublisher(id, user);
}

export async function searchMonographPublisher(searchParameters: SearchMonographPublisherHttp, user: RequestUser) {
  const {
    search_text,
    has_quitted,
    // TODO identifier_type,
    limit,
    offset,
  } = searchParameters;

  const publicSearchAttributes = ['official_name', 'other_names', 'previous_names'];
  const adminSearchAttributes = publicSearchAttributes.concat(['email']);
  const searchAttributes = isAdmin(user) ? adminSearchAttributes : publicSearchAttributes;

  const db = getKysely();

  // TODO: use separate publisher identifier search if string begins with publisher identifier
  // TODO: evaluate if need for category filter

  let query = db.selectFrom('monograph_publisher');

  if (search_text) {
    query = query.where((eb) => constructTextLikeSearch(eb, searchAttributes, search_text));
  }

  if (has_quitted) {
    query = query.where('has_quitted', '=', true);
  }

  const countQuery = query.select((eb) => eb.fn.countAll().as('totalDoc'));
  query = query.selectAll().orderBy('id', 'desc').limit(limit).offset(offset);

  const result = await query.execute();
  const { totalDoc } = await countQuery.executeTakeFirstOrThrow();

  if (isAdmin(user)) {
    return {
      totalDoc,
      results: result.map(asMonographPublisherAdminRead),
    };
  }

  return {
    totalDoc,
    results: result.map(asMonographPublisherGuestRead),
  };
}
