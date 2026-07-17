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

const monographPublicationRequestRouter = Router();

monographPublicationRequestRouter.post(
  '/',
  // TODO: middleware for turnstile
  validateRequestBody(createMonographPublicationRequestSchema),
  monographPublicationRequestController.createMonographPublicationRequest,
);

monographPublicationRequestRouter.post(
  '/search',
  allowAdminOnly,
  validateRequestBody(searchMonographPublicationRequestSchema),
  monographPublicationRequestController.searchMonographPublicationRequest,
);

monographPublicationRequestRouter.post(
  '/:id/approve',
  allowAdminOnly,
  validateRequestParams(idParameterSchema),
  monographPublicationRequestController.approveMonographPublicationRequest,
);

monographPublicationRequestRouter.post(
  '/:id/reject',
  allowAdminOnly,
  validateRequestParams(idParameterSchema),
  monographPublicationRequestController.rejectMonographPublicationRequest,
);

monographPublicationRequestRouter.post(
  '/:id/reprocess',
  allowAdminOnly,
  validateRequestParams(idParameterSchema),
  monographPublicationRequestController.reprocessMonographPublicationRequest,
);

monographPublicationRequestRouter.get(
  '/:id',
  allowAdminOnly,
  validateRequestParams(idParameterSchema),
  monographPublicationRequestController.readMonographPublicationRequest,
);

monographPublicationRequestRouter.patch(
  '/:id',
  allowAdminOnly,
  validateRequestParams(idParameterSchema),
  validateRequestBody(updateMonographPublicationRequestSchema),
  monographPublicationRequestController.updateMonographPublicationRequest,
);

export default monographPublicationRequestRouter;
