import { Router } from 'express';

import * as monographIdentifierBatchControllers from '../../controllers/monograph/monograph-identifier-batch-controller.ts';

import { validateRequestBody, validateRequestParams } from '../../middlewares/validation.ts';
import { createMonographIdentifierBatchSchema } from '../../validations/monograph/monograph-identifier-batch-validation.ts';
import { idParameterSchema } from '../../validations/common-validation.ts';

const monographIdentifierBatchRouter = Router();

monographIdentifierBatchRouter.post(
  '/',
  validateRequestBody(createMonographIdentifierBatchSchema),
  monographIdentifierBatchControllers.createMonographIdentifierBatch,
);

monographIdentifierBatchRouter.delete(
  '/:id',
  validateRequestParams(idParameterSchema, true),
  monographIdentifierBatchControllers.deleteMonographIdentifierBatch,
);

export default monographIdentifierBatchRouter;
