import HttpStatus from 'http-status';

import { getKysely } from '../db/database.ts';

import { ApiError } from '../utils/api-error.ts';

import { asMessageTemplateAdminRead } from '../dtl/message-template-dtl.ts';
import { getCurrentTime, removeUndefinedProperties } from './shared-interface-utils.ts';

import type {
  MessageTemplateRetrieveHttpParams,
  MessageTemplateUpdateHttpBody,
} from '../validations/message-template-validation.ts';
import type { RequestUser } from '../generic-types.ts';

export async function getMessageTemplate(params: MessageTemplateRetrieveHttpParams) {
  const db = getKysely();

  const dbResult = await db
    .selectFrom('message_template')
    .selectAll()
    .where('message_type', '=', params.message_type)
    .where('lang_code', '=', params.lang_code)
    .execute();

  const [messageTemplate] = dbResult;

  if (!messageTemplate) {
    throw new ApiError(
      HttpStatus.NOT_FOUND,
      'Not found',
      `No message templates were found with given parameters (message_type=${params.message_type}, lang_code=${params.lang_code}).`,
    );
  }

  if (dbResult.length > 1) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Conflict',
      `There exists too many message templates with given query (IDs ${dbResult.map((r) => r.id).join(', ')}).`,
    );
  }

  return asMessageTemplateAdminRead(messageTemplate);
}

export async function updateMessageTemplate(
  messageTemplateId: number,
  updateDoc: MessageTemplateUpdateHttpBody,
  user: RequestUser,
) {
  const db = getKysely();

  // Update within transaction to guarantee change of one row only
  await db.transaction().execute(async (trx) => {
    const updateValues = {
      subject: updateDoc.subject,
      body: updateDoc.body,
      modified_by: user.id,
      modified: getCurrentTime(),
    };

    const { numChangedRows } = await trx
      .updateTable('message_template')
      .set(removeUndefinedProperties(updateValues))
      .where('id', '=', messageTemplateId)
      .executeTakeFirstOrThrow();

    if (Number(numChangedRows) !== 1) {
      throw new Error('Update unexpectedly changed more or less than one row');
    }
  });

  return;
}
