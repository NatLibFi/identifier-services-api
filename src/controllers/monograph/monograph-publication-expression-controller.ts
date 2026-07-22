import type { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

import * as monographPublicationExpressionInterface from '../../interfaces/monograph/monograph-publication-expression-interface.ts';
import { MARC_RECORD_FORMAT } from '../../constants.ts';
import { ApiError } from '../../utils/api-error.ts';

export async function addMonographPublicationExpression(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await monographPublicationExpressionInterface.addMonographPublicationExpression(req.body, req.user);
    return res.status(HttpStatus.CREATED).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function updateMonographPublicationExpression(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await monographPublicationExpressionInterface.updateMonographPublicationExpression(
      Number(req.params['id']),
      req.body,
      req.user,
    );
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function deleteMonographPublicationExpression(req: Request, res: Response, next: NextFunction) {
  try {
    await monographPublicationExpressionInterface.deleteMonographPublicationExpression(Number(req.params['id']));
    return res.status(HttpStatus.NO_CONTENT).end();
  } catch (error) {
    return next(error);
  }
}

export async function createMonographPublicationExpressionMarc(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await monographPublicationExpressionInterface.createMonographPublicationExpressionMarc(
      Number(req.params['id']),
      req.body,
    );

    const { record_format } = req.body;

    if (record_format === MARC_RECORD_FORMAT.TEXT) {
      res.setHeader('content-type', 'text/plain');
      return res.status(HttpStatus.OK).attachment(`monograph-expression-${req.params['id']}.txt`).send(result);
    }

    if (record_format === MARC_RECORD_FORMAT.ISO2709) {
      // Using default content-type for binary types
      res.setHeader('content-type', 'application/octet-stream');
      return res.status(HttpStatus.OK).attachment(`monograph-expression-${req.params['id']}.mrc`).send(result);
    }

    if (record_format === MARC_RECORD_FORMAT.JSON) {
      return res.status(HttpStatus.OK).json(result);
    }

    // Using MARC_RECORD_JS is disallowed for http endpoint but allowed in validation to make typing consistent
    throw new ApiError(
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Unprocessable entity',
      `Cannot process format ${record_format}`,
    );
  } catch (error) {
    return next(error);
  }
}
