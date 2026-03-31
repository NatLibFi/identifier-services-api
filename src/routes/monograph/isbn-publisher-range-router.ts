import { Router } from 'express';

import * as isbnPublisherRangeControllers from '../../controllers/monograph/isbn-publisher-range-controller.ts';
import { validateRequestBody, validateRequestParams } from '../../middlewares/validation.ts';
import { idParameterSchema } from '../../validations/common-validation.ts';
import { createIsbnPublisherRangeSchema } from '../../validations/monograph/isbn-publisher-range-validation.ts';

const isbnPublisherRangeRouter = Router();

isbnPublisherRangeRouter.post(
  '/',
  validateRequestBody(createIsbnPublisherRangeSchema),
  isbnPublisherRangeControllers.createIsbnRange,
);
isbnPublisherRangeRouter.delete(
  '/:id',
  validateRequestParams(idParameterSchema, true),
  isbnPublisherRangeControllers.deleteIsbnRange,
);

export default isbnPublisherRangeRouter;
