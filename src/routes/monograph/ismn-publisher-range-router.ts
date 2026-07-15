import { Router } from 'express';

import * as ismnPublisherRangeControllers from '../../controllers/monograph/ismn-publisher-range-controller.ts';
import { validateRequestBody, validateRequestParams } from '../../middlewares/validation.ts';
import { idParameterSchema } from '../../validations/common-validation.ts';
import {
  createIsmnPublisherRangeSchema,
  getIsmnPublisherRangeIdentifiersSchema,
} from '../../validations/monograph/ismn-publisher-range-validation.ts';

const ismnPublisherRangeRouter = Router();

ismnPublisherRangeRouter.post(
  '/',
  validateRequestBody(createIsmnPublisherRangeSchema),
  ismnPublisherRangeControllers.createIsmnRange,
);

ismnPublisherRangeRouter.delete(
  '/:id',
  validateRequestParams(idParameterSchema, true),
  ismnPublisherRangeControllers.deleteIsmnRange,
);

ismnPublisherRangeRouter.post(
  '/:id/get-identifiers',
  validateRequestParams(idParameterSchema, true),
  validateRequestBody(getIsmnPublisherRangeIdentifiersSchema),
  ismnPublisherRangeControllers.getIsmnPublisherRangeIdentifiers,
);

export default ismnPublisherRangeRouter;
