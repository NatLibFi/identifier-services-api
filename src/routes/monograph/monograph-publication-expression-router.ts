import { Router } from 'express';

import * as monographPublicationExpressionController from '../../controllers/monograph/monograph-publication-expression-controller.ts';
import { validateRequestBody, validateRequestParams } from '../../middlewares/validation.ts';
import { idParameterSchema } from '../../validations/common-validation.ts';
import { updateMonographPublicationExpressionSchema } from '../../validations/monograph/monograph-publication-expression-validation.ts';

// Note: adminOnly needs to be applied at main router level
const monographPublicationExpressionRouter = Router();

monographPublicationExpressionRouter.patch(
  '/:id',
  validateRequestParams(idParameterSchema, true),
  validateRequestBody(updateMonographPublicationExpressionSchema),
  monographPublicationExpressionController.updateMonographPublicationExpression,
);

export default monographPublicationExpressionRouter;
