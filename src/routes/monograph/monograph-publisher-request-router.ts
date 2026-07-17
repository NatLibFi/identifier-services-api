import { Router } from 'express';

import * as monographPublisherRequestController from '../../controllers/monograph/monograph-publisher-request-controller.ts';
import { validateRequestBody } from '../../middlewares/validation.ts';

// import { allowAdminOnly } from '../../middlewares/auth.ts';

import { createMonographPublisherRequestSchema } from '../../validations/monograph/monograph-publisher-request-validation.ts';
// import { idParameterSchema } from '../../validations/common-validation.ts';

const monographPublisherRequestRouter = Router();

monographPublisherRequestRouter.post(
  '/',
  // TODO: middleware for turnstile
  validateRequestBody(createMonographPublisherRequestSchema),
  monographPublisherRequestController.createMonographPublisherRequest,
);

export default monographPublisherRequestRouter;
