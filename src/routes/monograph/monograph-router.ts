import { Router } from 'express';

import isbnRangeRouter from './isbn-range-router.ts';

const monographRouter = Router();
monographRouter.use('/isbn-ranges', isbnRangeRouter);

export default monographRouter;
