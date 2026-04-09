import { Router } from 'express';

import * as monographPublicationController from '../../controllers/monograph/monograph-publication-controller.ts';
import { validateRequestParams } from '../../middlewares/validation.ts';
import { idParameterSchema } from '../../validations/common-validation.ts';

const monographPublicationRouter = Router();

monographPublicationRouter.get(
  '/:id',
  validateRequestParams(idParameterSchema),
  monographPublicationController.readMonographPublication,
);

export default monographPublicationRouter;
