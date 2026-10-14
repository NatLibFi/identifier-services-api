import HttpStatus from 'http-status';

import { ApiError } from '../../utils/api-error.ts';
import { getKysely } from '../../db/database.ts';
import {
  getCurrentTime,
  removeUndefinedProperties,
  validateGetById,
  validateRowsDeleted,
  validateRowsInserted,
  validateRowsUpdatedExact,
} from '../shared-interface-utils.ts';
import { asSerialPublisherAdminRead, asSerialPublisherAutocomplete } from '../../dtl/serial/serial-publisher-dtl.ts';

import {
  getSerialPublisherMessageCount,
  getSerialPublisherPublicationCount,
  getSerialPublisherPublicationRequestCount,
} from './serial-publisher-interface-utils.ts';

import type {
  SerialPublisherInsert,
  SerialPublisherSelect,
  SerialPublisherUpdate,
} from '../../db/types/serial/types-serial-publisher.ts';
import type {
  CreateSerialPublisherHttp,
  SearchSerialPublisherHttp,
  UpdateSerialPublisherHttp,
} from '../../validations/serial/serial-publisher-validation.ts';
import type { RequestUser } from '../../generic-types.ts';
import type { Transaction } from 'kysely';
import type { Database } from '../../db/types.ts';

export async function createSerialPublisher(
  serialPublisherCreateDoc: CreateSerialPublisherHttp,
  user: RequestUser,
  trx?: Transaction<Database>,
) {
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
    // Block creating publisher with duplicate official name
    // TODO: boolean-based control for forms
    const normalizedName = serialPublisherCreateDoc.official_name.toLowerCase().trim();
    const { num_matching } = await transaction
      .selectFrom('serial_publisher')
      .select(transaction.fn.countAll<number>().as('num_matching'))
      .where((eb) => eb(eb.fn('lower', ['official_name']), '=', normalizedName))
      .executeTakeFirstOrThrow();

    if (num_matching > 0) {
      throw new ApiError(
        HttpStatus.CONFLICT,
        'Conflict',
        `Serial publisher with name "${serialPublisherCreateDoc.official_name}" already exists.`,
      );
    }

    const { official_name, contact_persons, lang_code, email_common, phone, address, zip, city, additional_info } =
      serialPublisherCreateDoc;

    const dbEntry: SerialPublisherInsert = {
      official_name,
      contact_persons: JSON.stringify(contact_persons),
      lang_code,
      email_common,
      phone,
      address,
      zip,
      city,
      additional_info,
      created: getCurrentTime(),
      created_by: user.id,
      modified: getCurrentTime(),
      modified_by: user.id,
    };

    const insertResult = await transaction.insertInto('serial_publisher').values(dbEntry).executeTakeFirstOrThrow();
    validateRowsInserted(insertResult, 1);

    if (controlledTransaction) {
      await controlledTransaction.commit().execute();
    }

    return { id: Number(insertResult.insertId) };
  } catch (error) {
    // In case transaction was not provided, controlled transaction needs to be rollbacked manually
    if (controlledTransaction) {
      await controlledTransaction.rollback().execute();
    }

    throw error;
  }
}

export async function readSerialPublisher(id: number): Promise<SerialPublisherSelect> {
  const db = getKysely();
  const dbResult = await db.selectFrom('serial_publisher').selectAll().where('id', '=', id).execute();
  const serialPublisherResult = validateGetById(dbResult);

  return asSerialPublisherAdminRead(serialPublisherResult);
}

export async function deleteSerialPublisher(id: number): Promise<void> {
  await readSerialPublisher(id);

  // constraints
  const numAssociatedRequests = await getSerialPublisherPublicationRequestCount(id);
  if (numAssociatedRequests > 0) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Cannot remove serial publisher id ${id} because it is associated with ${numAssociatedRequests} serial publication requests.`,
    );
  }

  const numAssociatedMessages = await getSerialPublisherMessageCount(id);
  if (numAssociatedMessages > 0) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Cannot remove serial publisher id ${id} because it is associated with ${numAssociatedMessages} messages.`,
    );
  }

  const numAssociatedPublications = await getSerialPublisherPublicationCount(id);
  if (numAssociatedPublications > 0) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `Cannot remove serial publisher id ${id} because it is associated with ${numAssociatedPublications} serial publications.`,
    );
  }

  const db = getKysely();

  await db.transaction().execute(async (trx) => {
    const deleteResult = await trx.deleteFrom('serial_publisher').where('id', '=', id).executeTakeFirstOrThrow();
    validateRowsDeleted(deleteResult, 1);
  });

  return;
}

export async function updateSerialPublisher(
  id: number,
  serialPublisherUpdateDoc: UpdateSerialPublisherHttp,
  user: RequestUser,
): Promise<SerialPublisherSelect> {
  await readSerialPublisher(id);

  const db = getKysely();
  const { official_name, contact_persons, email_common, phone, address, zip, city, lang_code, additional_info } =
    serialPublisherUpdateDoc;

  const serialPublisherUpdateValues = {
    official_name,
    contact_persons: contact_persons ? JSON.stringify(contact_persons) : undefined,
    email_common,
    phone,
    address,
    zip,
    city,
    lang_code,
    additional_info,
    modified: getCurrentTime(),
    modified_by: user.id,
  };

  const dbUpdateValues = removeUndefinedProperties<SerialPublisherUpdate>(serialPublisherUpdateValues);

  // Update within transaction to guarantee change of one row only
  await db.transaction().execute(async (trx) => {
    const updateResult = await trx
      .updateTable('serial_publisher')
      .set(dbUpdateValues)
      .where('id', '=', id)
      .executeTakeFirstOrThrow();

    validateRowsUpdatedExact(updateResult, 1);
  });

  // Use consistent return value between processing
  return readSerialPublisher(id);
}

export async function searchSerialPublisher(searchParameters: SearchSerialPublisherHttp) {
  const { search_text, limit, offset } = searchParameters;

  const db = getKysely();
  let query = db.selectFrom('serial_publisher');

  if (search_text) {
    const normalizedSearch = `%${search_text.trim()}%`.toLowerCase();

    query = query.where((eb) =>
      eb.or([
        eb(eb.fn('lower', ['official_name']), 'like', normalizedSearch),
        eb(eb.fn('lower', ['additional_info']), 'like', normalizedSearch),
      ]),
    );
  }

  const countQuery = query.clearSelect().select((eb) => eb.fn.countAll().as('total_doc'));
  const { total_doc } = await countQuery.executeTakeFirstOrThrow();

  query = query.selectAll('serial_publisher').orderBy('id', 'desc').limit(limit).offset(offset);

  // @ts-expect-error query builder does not understand typing here
  const result: SerialPublisherSelect[] = await query.execute();

  return {
    total_doc,
    results: await Promise.all(result.map((p) => asSerialPublisherAdminRead(p))),
  };
}

export async function serialPublisherAutocomplete(search_text: string) {
  const normalizedSearch = `%${search_text.trim()}%`.toLowerCase();

  const db = getKysely();
  const result = await db
    .selectFrom('serial_publisher')
    .selectAll()
    .where((eb) => eb(eb.fn('lower', ['official_name']), 'like', normalizedSearch))
    .orderBy('official_name', 'asc')
    .limit(10)
    .offset(0)
    .execute();

  return result.map(asSerialPublisherAutocomplete);
}
