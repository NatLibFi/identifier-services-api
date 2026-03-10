import { getKysely } from '../../db/database.ts';
import {
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
import type { UpdateMonographPublisherHttp } from '../../validations/monograph/monograph-publisher-validation.ts';
import type { RequestUser } from '../../generic-types.ts';
import { hasAdminApplicationRole } from '../../middlewares/auth.ts';

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
  return readMonographPublisher(id);
}
