import { Router } from 'express';

import * as monographIdentifierBatchControllers from '../../controllers/monograph/monograph-identifier-batch-controller.ts';

import { allowAdminOnly } from '../../middlewares/auth.ts';
import { validateRequestBody, validateRequestParams } from '../../middlewares/validation.ts';

import {
  createMonographIdentifierBatchSchema,
  downloadMonographIdentifierBatchSchema,
} from '../../validations/monograph/monograph-identifier-batch-validation.ts';
import { idParameterSchema } from '../../validations/common-validation.ts';

import type { MiddlewareFunction } from '../../generic-types.ts';

export default function createMonographIdentifierBatchRouter(turnstileMiddleware: MiddlewareFunction) {
  const monographIdentifierBatchRouter = Router();

  monographIdentifierBatchRouter.post(
    '/',
    allowAdminOnly,
    validateRequestBody(createMonographIdentifierBatchSchema),
    monographIdentifierBatchControllers.createMonographIdentifierBatch,
  );

  monographIdentifierBatchRouter.delete(
    '/:id',
    allowAdminOnly,
    validateRequestParams(idParameterSchema, true),
    monographIdentifierBatchControllers.deleteMonographIdentifierBatch,
  );

  monographIdentifierBatchRouter.post(
    '/:id/download',
    turnstileMiddleware,
    validateRequestParams(idParameterSchema, true),
    validateRequestBody(downloadMonographIdentifierBatchSchema),
    monographIdentifierBatchControllers.downloadBatchIdentifiers,
  );

  return monographIdentifierBatchRouter;
}
