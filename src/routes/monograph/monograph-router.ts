import { Router } from 'express';

import isbnRangeRouter from './isbn-range-router.ts';
import isbnPublisherRangeRouter from './isbn-publisher-range-router.ts';

import ismnRangeRouter from './ismn-range-router.ts';
import ismnPublisherRangeRouter from './ismn-publisher-range-router.ts';

import monographPublisherRouter from './monograph-publisher-router.ts';
import createMonographPublisherRequestRouter from './monograph-publisher-request-router.ts';

import monographPublicationRouter from './monograph-publication-router.ts';
import monographPublicationExpressionRouter from './monograph-publication-expression-router.ts';
import monographPublicationManifestationRouter from './monograph-publication-manifestation-router.ts';

import createMonographPublicationRequestRouter from './monograph-publication-request-router.ts';

import createMonographIdentifierBatchRouter from './monograph-identifier-batch-router.ts';

import createMonographMessageRouter from './monograph-message-router.ts';
import createMonographStatisticsRouter from './monograph-statistics-router.ts';

import { allowAdminOnly } from '../../middlewares/auth.ts';

import type { MessagingConfiguration, MonographPublisherConfiguration } from '../../app.ts';
import type { MiddlewareFunction } from '../../generic-types.ts';

export default function createMonographRouter(
  monographPublisherConfiguration: MonographPublisherConfiguration,
  messagingConfiguration: MessagingConfiguration,
  turnstileMiddleware: MiddlewareFunction,
) {
  const monographRouter = Router();
  monographRouter.use('/isbn-ranges', allowAdminOnly, isbnRangeRouter);
  monographRouter.use('/isbn-publisher-ranges', isbnPublisherRangeRouter);

  monographRouter.use('/ismn-ranges', allowAdminOnly, ismnRangeRouter);
  monographRouter.use('/ismn-publisher-ranges', ismnPublisherRangeRouter);

  monographRouter.use('/identifier-batches', createMonographIdentifierBatchRouter(turnstileMiddleware));

  monographRouter.use('/publishers', monographPublisherRouter);
  monographRouter.use('/publisher-requests', createMonographPublisherRequestRouter(turnstileMiddleware));

  monographRouter.use('/publications', allowAdminOnly, monographPublicationRouter);
  monographRouter.use('/publication-expressions', allowAdminOnly, monographPublicationExpressionRouter);
  monographRouter.use('/publication-manifestations', allowAdminOnly, monographPublicationManifestationRouter);
  monographRouter.use('/publication-requests', createMonographPublicationRequestRouter(turnstileMiddleware));

  monographRouter.use(
    '/messages',
    allowAdminOnly,
    createMonographMessageRouter(monographPublisherConfiguration, messagingConfiguration),
  );

  monographRouter.use('/statistics', allowAdminOnly, createMonographStatisticsRouter(monographPublisherConfiguration));

  return monographRouter;
}
