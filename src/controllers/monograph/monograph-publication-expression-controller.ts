import type { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

import * as monographPublicationExpressionInterface from '../../interfaces/monograph/monograph-publication-expression-interface.ts';

export async function updateMonographPublicationExpression(req: Request, res: Response, next: NextFunction) {
  try {
    await monographPublicationExpressionInterface.updateMonographPublicationExpression(
      Number(req.params['id']),
      req.body,
      req.user,
    );
    return res.status(HttpStatus.NO_CONTENT).end();
  } catch (error) {
    return next(error);
  }
}
