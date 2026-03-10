import { Router } from 'express';

import * as monographPublisherControllers from '../../controllers/monograph/monograph-publisher-controller.ts';
import { validateRequestParams } from '../../middlewares/validation.ts';
import { idParameterSchema } from '../../validations/common-validation.ts';
import { allowAdminOnly } from '../../middlewares/auth.ts';

const isbnRangeRouter = Router();

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

export default isbnRangeRouter;
