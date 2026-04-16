import { Router } from 'express';

import isbnRangeRouter from './isbn-range-router.ts';
import isbnPublisherRangeRouter from './isbn-publisher-range-router.ts';
import monographPublisherRouter from './monograph-publisher-router.ts';
import monographPublicationRouter from './monograph-publication-router.ts';
import monographPublicationExpressionRouter from './monograph-publication-expression-router.ts';
import monographPublicationRequestRouter from './monograph-publication-request-router.ts';

import { allowAdminOnly } from '../../middlewares/auth.ts';

const monographRouter = Router();
monographRouter.use('/isbn-ranges', allowAdminOnly, isbnRangeRouter);
monographRouter.use('/isbn-publisher-ranges', allowAdminOnly, isbnPublisherRangeRouter);
monographRouter.use('/publishers', monographPublisherRouter);
monographRouter.use('/publications', allowAdminOnly, monographPublicationRouter);
monographRouter.use('/publication-expressions', allowAdminOnly, monographPublicationExpressionRouter);
monographRouter.use('/publication-requests', monographPublicationRequestRouter);

export default monographRouter;
