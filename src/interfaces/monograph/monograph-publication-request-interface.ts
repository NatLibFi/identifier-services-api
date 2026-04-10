// import HttpStatus from 'http-status';

import { getKysely } from '../../db/database.ts';
import { validateGetById } from '../interface-utils/common-interface-utils.ts';

import { asMonographPublicationRequestAdminRead } from '../../dtl/monograph/monograph-publication-request-dtl.ts';
import { readMonographPublication } from './monograph-publication-interface.ts';

import type { MonographPublicationRequestSelect } from '../../db/types/monograph/types-monograph-publication-request.ts';

export async function readMonographPublicationRequest(id: number) {
  const db = getKysely();

  const dbResult = await db.selectFrom('monograph_publication_request').selectAll().where('id', '=', id).execute();
  const monographPublicationRequest = validateGetById<MonographPublicationRequestSelect>(dbResult);

  const publication = await readMonographPublication(id);
  const result = asMonographPublicationRequestAdminRead(monographPublicationRequest, publication);

  return result;
}
