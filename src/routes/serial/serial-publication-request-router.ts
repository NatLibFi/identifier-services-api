import { Router } from 'express';

import * as serialPublicationRequestControllers from '../../controllers/serial/serial-publication-request-controller.ts';
import { validateRequestBody } from '../../middlewares/validation.ts';
import { createSerialPublicationRequestSchema } from '../../validations/serial/serial-publication-request-validation.ts';

import type { MiddlewareFunction } from '../../generic-types.ts';

export default function createSerialPublicationRequestRouter(turnstileMiddleware: MiddlewareFunction) {
  const serialPublicationRequestRouter = Router();

  serialPublicationRequestRouter.post(
    '/',
    turnstileMiddleware,
    validateRequestBody(createSerialPublicationRequestSchema),
    serialPublicationRequestControllers.createSerialPublicationRequest,
  );

  return serialPublicationRequestRouter;
}
