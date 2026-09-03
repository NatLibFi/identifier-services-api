import { Router } from 'express';

import * as issnRangeControllers from '../../controllers/serial/issn-range-controller.ts';
import { validateRequestBody, validateRequestParams } from '../../middlewares/validation.ts';
import { createIssnRangeSchema, updateIssnRangeSchema } from '../../validations/serial/issn-range-validation.ts';
import { idParameterSchema } from '../../validations/common-validation.ts';

const issnRangeRouter = Router();

issnRangeRouter.get('/', issnRangeControllers.readIssnRanges);
issnRangeRouter.post('/', validateRequestBody(createIssnRangeSchema), issnRangeControllers.createIssnRange);

issnRangeRouter.delete('/:id', validateRequestParams(idParameterSchema, true), issnRangeControllers.deleteIssnRange);

issnRangeRouter.patch(
  '/:id',
  validateRequestParams(idParameterSchema, true),
  validateRequestBody(updateIssnRangeSchema),
  issnRangeControllers.updateIssnRange,
);

export default issnRangeRouter;
