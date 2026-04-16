import { Router } from 'express';

import * as monographPublicationManifestationController from '../../controllers/monograph/monograph-publication-manifestation-controller.ts';
import { validateRequestBody, validateRequestParams } from '../../middlewares/validation.ts';
import { idParameterSchema } from '../../validations/common-validation.ts';
import { updateMonographPublicationManifestationSchema } from '../../validations/monograph/monograph-publication-manifestation-validation.ts';

// Note: adminOnly needs to be applied at main router level
const monographPublicationManifestationRouter = Router();

monographPublicationManifestationRouter.patch(
  '/:id',
  validateRequestParams(idParameterSchema, true),
  validateRequestBody(updateMonographPublicationManifestationSchema),
  monographPublicationManifestationController.updateMonographPublicationManifestation,
);

export default monographPublicationManifestationRouter;
