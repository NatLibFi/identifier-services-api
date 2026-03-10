import { Router } from 'express';

import * as monographPublisherControllers from '../../controllers/monograph/monograph-publisher-controller.ts';
import { validateRequestBody, validateRequestParams } from '../../middlewares/validation.ts';
import { idParameterSchema } from '../../validations/common-validation.ts';
import { allowAdminOnly } from '../../middlewares/auth.ts';
import {
  createMonographPublisherSchema,
  updateMonographPublisherSchema,
} from '../../validations/monograph/monograph-publisher-validation.ts';

const isbnRangeRouter = Router();

isbnRangeRouter.post(
  '/',
  allowAdminOnly,
  validateRequestBody(createMonographPublisherSchema),
  monographPublisherControllers.createMonographPublisher,
);

isbnRangeRouter.get(
  '/:id',
  validateRequestParams(idParameterSchema),
  monographPublisherControllers.readMonographPublisher,
);

isbnRangeRouter.delete(
  '/:id',
  allowAdminOnly,
  validateRequestParams(idParameterSchema),
  monographPublisherControllers.deleteMonographPublisher,
);

isbnRangeRouter.patch(
  '/:id',
  allowAdminOnly,
  validateRequestParams(idParameterSchema, true),
  validateRequestBody(updateMonographPublisherSchema),
  monographPublisherControllers.updateMonographPublisher,
);

export default isbnRangeRouter;
