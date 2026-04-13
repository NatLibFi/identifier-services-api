import { Router } from 'express';

import * as monographPublicationRequestController from '../../controllers/monograph/monograph-publication-request-controller.ts';
import { validateRequestBody, validateRequestParams } from '../../middlewares/validation.ts';
import { idParameterSchema } from '../../validations/common-validation.ts';
import { allowAdminOnly } from '../../middlewares/auth.ts';
import {
  createMonographPublicationRequestSchema,
  searchMonographPublicationRequestSchema,
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

monographPublicationRouter.get(
  '/:id',
  allowAdminOnly,
  validateRequestParams(idParameterSchema),
  monographPublicationRequestController.readMonographPublicationRequest,
);

export default monographPublicationRouter;
