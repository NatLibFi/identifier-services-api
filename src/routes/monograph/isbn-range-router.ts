import { Router } from 'express';

import * as isbnRangeControllers from '../../controllers/monograph/isbn-range-controller.ts';
import { validateRequestBody } from '../../middlewares/validation.ts';
import { createIsbnRangeSchema } from '../../validations/monograph/isbn-range-validation.ts';

const isbnRangeRouter = Router();
isbnRangeRouter.get('/', isbnRangeControllers.readIsbnRanges);
isbnRangeRouter.post('/', validateRequestBody(createIsbnRangeSchema), isbnRangeControllers.createIsbnRange);

export default isbnRangeRouter;
