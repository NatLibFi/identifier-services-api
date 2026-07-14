import { Router } from 'express';

import * as ismnRangeControllers from '../../controllers/monograph/ismn-range-controller.ts';

import { validateRequestBody, validateRequestParams } from '../../middlewares/validation.ts';
import { createIsmnRangeSchema, updateIsmnRangeSchema } from '../../validations/monograph/ismn-range-validation.ts';
import { idParameterSchema } from '../../validations/common-validation.ts';

const ismnRangeRouter = Router();

ismnRangeRouter.get('/', ismnRangeControllers.readIsmnRanges);
ismnRangeRouter.post('/', validateRequestBody(createIsmnRangeSchema), ismnRangeControllers.createIsmnRange);

ismnRangeRouter.get('/:id', validateRequestParams(idParameterSchema, true), ismnRangeControllers.readIsmnRange);
ismnRangeRouter.delete('/:id', validateRequestParams(idParameterSchema, true), ismnRangeControllers.deleteIsmnRange);

ismnRangeRouter.patch(
  '/:id',
  validateRequestParams(idParameterSchema, true),
  validateRequestBody(updateIsmnRangeSchema),
  ismnRangeControllers.updateIsmnRange,
);

export default ismnRangeRouter;
