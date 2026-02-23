import { Router } from 'express';

import * as isbnRangeControllers from '../../controllers/monograph/isbn-range-controller.ts';
import { validateRequestBody, validateRequestParams } from '../../middlewares/validation.ts';
import { createIsbnRangeSchema, updateIsbnRangeSchema } from '../../validations/monograph/isbn-range-validation.ts';
import { idParameterSchema } from '../../validations/common-validation.ts';

const isbnRangeRouter = Router();

isbnRangeRouter.get('/', isbnRangeControllers.readIsbnRanges);
isbnRangeRouter.post('/', validateRequestBody(createIsbnRangeSchema), isbnRangeControllers.createIsbnRange);

isbnRangeRouter.get('/:id', validateRequestParams(idParameterSchema, true), isbnRangeControllers.readIsbnRange);
isbnRangeRouter.delete('/:id', validateRequestParams(idParameterSchema, true), isbnRangeControllers.deleteIsbnRange);

isbnRangeRouter.patch(
  '/:id',
  validateRequestParams(idParameterSchema, true),
  validateRequestBody(updateIsbnRangeSchema),
  isbnRangeControllers.updateIsbnRange,
);

export default isbnRangeRouter;
