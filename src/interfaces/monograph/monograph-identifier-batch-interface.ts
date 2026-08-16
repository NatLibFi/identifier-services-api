// import HttpStatus from 'http-status';

// import { ApiError } from '../../utils/api-error.ts';
import { getKysely } from '../../db/database.ts';

import { validateGetById } from '../shared-interface-utils.ts';
import { asMonographIdentifierBatchAdminRead } from '../../dtl/monograph/monograph-identifier-batch-dtl.ts';
import type { MonographIdentifierBatchSelect } from '../../db/types/monograph/types-monograph-identifier-batch.ts';

export async function readMonographIdentifierBatch(id: number) {
  const db = getKysely();
  const dbResult = await db.selectFrom('monograph_identifier_batch').selectAll().where('id', '=', id).execute();

  const result = validateGetById<MonographIdentifierBatchSelect>(dbResult);

  return asMonographIdentifierBatchAdminRead(result);
}
