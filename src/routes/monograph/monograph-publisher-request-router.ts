import { Router } from 'express';

import * as monographPublisherRequestController from '../../controllers/monograph/monograph-publisher-request-controller.ts';
import { validateRequestBody, validateRequestParams } from '../../middlewares/validation.ts';

import { allowAdminOnly } from '../../middlewares/auth.ts';

import {
  createMonographPublisherRequestSchema,
  updateMonographPublisherRequestSchema,
  searchMonographPublisherRequestSchema,
} from '../../validations/monograph/monograph-publisher-request-validation.ts';
import { idParameterSchema } from '../../validations/common-validation.ts';

import type { MiddlewareFunction } from '../../generic-types.ts';

export default function createMonographPublisherRequestRouter(turnstileMiddleware: MiddlewareFunction) {
  const monographPublisherRequestRouter = Router();

  monographPublisherRequestRouter.post(
    '/',
    turnstileMiddleware,
    validateRequestBody(createMonographPublisherRequestSchema),
    monographPublisherRequestController.createMonographPublisherRequest,
  );

  monographPublisherRequestRouter.post(
    '/search',
    allowAdminOnly,
    validateRequestBody(searchMonographPublisherRequestSchema),
    monographPublisherRequestController.searchMonographPublisherRequest,
  );

  monographPublisherRequestRouter.post(
    '/:id/approve',
    allowAdminOnly,
    validateRequestParams(idParameterSchema),
    monographPublisherRequestController.approveMonographPublisherRequest,
  );

  monographPublisherRequestRouter.delete(
    '/:id',
    allowAdminOnly,
    validateRequestParams(idParameterSchema),
    monographPublisherRequestController.deleteMonographPublisherRequest,
  );

  monographPublisherRequestRouter.get(
    '/:id',
    allowAdminOnly,
    validateRequestParams(idParameterSchema),
    monographPublisherRequestController.readMonographPublisherRequest,
  );

  monographPublisherRequestRouter.patch(
    '/:id',
    allowAdminOnly,
    validateRequestParams(idParameterSchema),
    validateRequestBody(updateMonographPublisherRequestSchema),
    monographPublisherRequestController.updateMonographPublisherRequest,
  );

  return monographPublisherRequestRouter;
}
