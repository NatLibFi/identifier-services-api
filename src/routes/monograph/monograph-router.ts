import { Router } from 'express';

import isbnRangeRouter from './isbn-range-router.ts';
import isbnPublisherRangeRouter from './isbn-publisher-range-router.ts';

import ismnRangeRouter from './ismn-range-router.ts';
import ismnPublisherRangeRouter from './ismn-publisher-range-router.ts';

import monographPublisherRouter from './monograph-publisher-router.ts';
import monographPublisherRequestRouter from './monograph-publisher-request-router.ts';

import monographPublicationRouter from './monograph-publication-router.ts';
import monographPublicationExpressionRouter from './monograph-publication-expression-router.ts';
import monographPublicationManifestationRouter from './monograph-publication-manifestation-router.ts';
import monographPublicationRequestRouter from './monograph-publication-request-router.ts';

import createMonographMessageRouter from './monograph-message-router.ts';

import { allowAdminOnly } from '../../middlewares/auth.ts';

import type { MessagingConfiguration, MonographPublisherConfiguration } from '../../app.ts';

export default function (
  monographPublisherConfiguration: MonographPublisherConfiguration,
  messagingConfiguration: MessagingConfiguration,
) {
  const monographRouter = Router();
  monographRouter.use('/isbn-ranges', allowAdminOnly, isbnRangeRouter);
  monographRouter.use('/isbn-publisher-ranges', allowAdminOnly, isbnPublisherRangeRouter);

  monographRouter.use('/ismn-ranges', allowAdminOnly, ismnRangeRouter);
  monographRouter.use('/ismn-publisher-ranges', allowAdminOnly, ismnPublisherRangeRouter);

  monographRouter.use('/publishers', monographPublisherRouter);
  monographRouter.use('/publisher-requests', monographPublisherRequestRouter);

  monographRouter.use('/publications', allowAdminOnly, monographPublicationRouter);
  monographRouter.use('/publication-expressions', allowAdminOnly, monographPublicationExpressionRouter);
  monographRouter.use('/publication-manifestations', allowAdminOnly, monographPublicationManifestationRouter);
  monographRouter.use('/publication-requests', monographPublicationRequestRouter);
  monographRouter.use(
    '/messages',
    allowAdminOnly,
    createMonographMessageRouter(monographPublisherConfiguration, messagingConfiguration),
  );

  return monographRouter;
}
