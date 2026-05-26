import type { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

import * as monographPublicationExpressionInterface from '../../interfaces/monograph/monograph-publication-expression-interface.ts';

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
