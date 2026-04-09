// import HttpStatus from 'http-status';

import { getKysely } from '../../db/database.ts';
import { validateGetById } from '../interface-utils/common-interface-utils.ts';

import type { MonographPublicationSelect } from '../../db/types/monograph/types-monograph-publication.ts';

import { asMonographPublicationAdminRead } from '../../dtl/monograph/monograph-publication-dtl.ts';
import { getPublicationExpressions } from './monograph-publication-interface-utils.ts';

export async function readMonographPublication(id: number) {
  const db = getKysely();
  const dbResult = await db.selectFrom('monograph_publication').selectAll().where('id', '=', id).execute();
  const monographPublication = validateGetById<MonographPublicationSelect>(dbResult);
  const expressions = await getPublicationExpressions(id);

  return asMonographPublicationAdminRead(monographPublication, expressions);
}
