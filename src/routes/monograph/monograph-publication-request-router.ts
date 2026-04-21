import { Router } from 'express';

import * as monographPublicationRequestController from '../../controllers/monograph/monograph-publication-request-controller.ts';
import { validateRequestBody, validateRequestParams } from '../../middlewares/validation.ts';
import { idParameterSchema } from '../../validations/common-validation.ts';
import { allowAdminOnly } from '../../middlewares/auth.ts';
import {
  createMonographPublicationRequestSchema,
  searchMonographPublicationRequestSchema,
  updateMonographPublicationRequestSchema,
} from '../../validations/monograph/monograph-publication-request-validation.ts';

const monographPublicationRouter = Router();

monographPublicationRouter.post(
  '/',
  // TODO: middleware for turnstile
  validateRequestBody(createMonographPublicationRequestSchema),
  monographPublicationRequestController.createMonographPublicationRequest,
);

monographPublicationRouter.post(
  '/search',
  allowAdminOnly,
  validateRequestBody(searchMonographPublicationRequestSchema),
  monographPublicationRequestController.searchMonographPublicationRequest,
);

monographPublicationRouter.post(
  '/:id/approve',
  allowAdminOnly,
  validateRequestParams(idParameterSchema),
  monographPublicationRequestController.approveMonographPublicationRequest,
);

monographPublicationRouter.post(
  '/:id/reject',
  allowAdminOnly,
  validateRequestParams(idParameterSchema),
  monographPublicationRequestController.rejectMonographPublicationRequest,
);

monographPublicationRouter.get(
  '/:id',
  allowAdminOnly,
  validateRequestParams(idParameterSchema),
  monographPublicationRequestController.readMonographPublicationRequest,
);

monographPublicationRouter.patch(
  '/:id',
  allowAdminOnly,
  validateRequestParams(idParameterSchema),
  validateRequestBody(updateMonographPublicationRequestSchema),
  monographPublicationRequestController.updateMonographPublicationRequest,
);

export default monographPublicationRouter;
