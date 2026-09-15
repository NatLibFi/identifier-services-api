import { Router } from 'express';

import * as serialPublicationRequestControllers from '../../controllers/serial/serial-publication-request-controller.ts';
import { validateRequestBody, validateRequestParams } from '../../middlewares/validation.ts';
import {
  createSerialPublicationRequestSchema,
  updateSerialPublicationRequestSchema,
} from '../../validations/serial/serial-publication-request-validation.ts';
import { idParameterSchema } from '../../validations/common-validation.ts';
import { allowAdminOnly } from '../../middlewares/auth.ts';

import type { MiddlewareFunction } from '../../generic-types.ts';

export default function createSerialPublicationRequestRouter(turnstileMiddleware: MiddlewareFunction) {
  const serialPublicationRequestRouter = Router();

  serialPublicationRequestRouter.post(
    '/',
    turnstileMiddleware,
    validateRequestBody(createSerialPublicationRequestSchema),
    serialPublicationRequestControllers.createSerialPublicationRequest,
  );

  serialPublicationRequestRouter.get(
    '/:id',
    allowAdminOnly,
    validateRequestParams(idParameterSchema, true),
    serialPublicationRequestControllers.readSerialPublicationRequest,
  );
  serialPublicationRequestRouter.delete(
    '/:id',
    allowAdminOnly,
    validateRequestParams(idParameterSchema, true),
    serialPublicationRequestControllers.deleteSerialPublicationRequest,
  );

  serialPublicationRequestRouter.patch(
    '/:id',
    allowAdminOnly,
    validateRequestParams(idParameterSchema, true),
    validateRequestBody(updateSerialPublicationRequestSchema),
    serialPublicationRequestControllers.updateSerialPublicationRequest,
  );

  return serialPublicationRequestRouter;
}
