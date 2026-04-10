import { Router } from 'express';

import * as monographPublicationRequestController from '../../controllers/monograph/monograph-publication-request-controller.ts';
import { validateRequestParams } from '../../middlewares/validation.ts';
import { idParameterSchema } from '../../validations/common-validation.ts';
import { allowAdminOnly } from '../../middlewares/auth.ts';

const monographPublicationRouter = Router();

monographPublicationRouter.get(
  '/:id',
  allowAdminOnly,
  validateRequestParams(idParameterSchema),
  monographPublicationRequestController.readMonographPublicationRequest,
);

export default monographPublicationRouter;
