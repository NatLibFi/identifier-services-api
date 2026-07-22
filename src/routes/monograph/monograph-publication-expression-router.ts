import { Router } from 'express';

import * as monographPublicationExpressionController from '../../controllers/monograph/monograph-publication-expression-controller.ts';
import { validateRequestBody, validateRequestParams } from '../../middlewares/validation.ts';
import { idParameterSchema } from '../../validations/common-validation.ts';
import {
  addMonographPublicationExpressionSchema,
  updateMonographPublicationExpressionSchema,
} from '../../validations/monograph/monograph-publication-expression-validation.ts';
import { getMarcRecordSchema } from '../../validations/marc-record-validation.ts';

// Note: adminOnly needs to be applied at main router level
const monographPublicationExpressionRouter = Router();

monographPublicationExpressionRouter.post(
  '/',
  validateRequestBody(addMonographPublicationExpressionSchema),
  monographPublicationExpressionController.addMonographPublicationExpression,
);

// Note: using POST here as QUERY does not have enough support and GET does not work with request body
monographPublicationExpressionRouter.post(
  '/:id/marc',
  validateRequestParams(idParameterSchema, true),
  validateRequestBody(getMarcRecordSchema),
  monographPublicationExpressionController.createMonographPublicationExpressionMarc,
);

monographPublicationExpressionRouter.patch(
  '/:id',
  validateRequestParams(idParameterSchema, true),
  validateRequestBody(updateMonographPublicationExpressionSchema),
  monographPublicationExpressionController.updateMonographPublicationExpression,
);

monographPublicationExpressionRouter.delete(
  '/:id',
  validateRequestParams(idParameterSchema, true),
  monographPublicationExpressionController.deleteMonographPublicationExpression,
);

export default monographPublicationExpressionRouter;
