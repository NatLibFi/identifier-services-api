import { Router } from 'express';

import isbnRangeRouter from './isbn-range-router.ts';
import { allowAdminOnly } from '../../middlewares/auth.ts';

const monographRouter = Router();
monographRouter.use('/isbn-ranges', allowAdminOnly, isbnRangeRouter);

export default monographRouter;
