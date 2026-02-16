import { Router } from 'express';

import * as isbnRangeControllers from '../../controllers/monograph/isbn-range-controller.ts';

const isbnRangeRouter = Router();
isbnRangeRouter.get('/', isbnRangeControllers.readIsbnRanges);

export default isbnRangeRouter;
