import { Router } from 'express';

import * as isbnPublisherRangeControllers from '../../controllers/monograph/isbn-publisher-range-controller.ts';
import { allowAdminOnly } from '../../middlewares/auth.ts';
import { validateRequestBody, validateRequestParams } from '../../middlewares/validation.ts';
import { idParameterSchema } from '../../validations/common-validation.ts';
import { createIsbnPublisherRangeSchema } from '../../validations/monograph/isbn-publisher-range-validation.ts';

const isbnPublisherRangeRouter = Router();

isbnPublisherRangeRouter.post(
  '/',
  allowAdminOnly,
  validateRequestBody(createIsbnPublisherRangeSchema),
  isbnPublisherRangeControllers.createIsbnPublisherRange,
);

isbnPublisherRangeRouter.get(
  '/:id',
  validateRequestParams(idParameterSchema, true),
  isbnPublisherRangeControllers.readIsbnPublisherRangePublicInfo,
);

isbnPublisherRangeRouter.delete(
  '/:id',
  allowAdminOnly,
  validateRequestParams(idParameterSchema, true),
  isbnPublisherRangeControllers.deleteIsbnPublisherRange,
);

export default isbnPublisherRangeRouter;
