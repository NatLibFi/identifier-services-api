import { Router } from 'express';

import * as ismnPublisherRangeControllers from '../../controllers/monograph/ismn-publisher-range-controller.ts';
import { validateRequestBody, validateRequestParams } from '../../middlewares/validation.ts';
import { idParameterSchema } from '../../validations/common-validation.ts';
import { createIsmnPublisherRangeSchema } from '../../validations/monograph/ismn-publisher-range-validation.ts';
import { allowAdminOnly } from '../../middlewares/auth.ts';

const ismnPublisherRangeRouter = Router();

ismnPublisherRangeRouter.post(
  '/',
  allowAdminOnly,
  validateRequestBody(createIsmnPublisherRangeSchema),
  ismnPublisherRangeControllers.createIsmnRange,
);

ismnPublisherRangeRouter.get(
  '/:id',
  validateRequestParams(idParameterSchema, true),
  ismnPublisherRangeControllers.readIsmnPublisherRangePublicInfo,
);

ismnPublisherRangeRouter.delete(
  '/:id',
  allowAdminOnly,
  validateRequestParams(idParameterSchema, true),
  ismnPublisherRangeControllers.deleteIsmnRange,
);

export default ismnPublisherRangeRouter;
