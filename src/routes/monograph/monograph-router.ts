import { Router } from 'express';

import isbnRangeRouter from './isbn-range-router.ts';
import monographPublisherRouter from './monograph-publisher-router.ts';

import { allowAdminOnly } from '../../middlewares/auth.ts';

const monographRouter = Router();
monographRouter.use('/isbn-ranges', allowAdminOnly, isbnRangeRouter);
monographRouter.use('/monograph-publishers', monographPublisherRouter);

export default monographRouter;
