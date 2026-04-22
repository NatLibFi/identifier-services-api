import type { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

import * as monographPublicationInterface from '../../interfaces/monograph/monograph-publication-interface.ts';

export async function readMonographPublication(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await monographPublicationInterface.readMonographPublication(Number(req.params['id']));
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function updateMonographPublication(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await monographPublicationInterface.updateMonographPublication(
      Number(req.params['id']),
      req.body,
      req.user,
    );
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function searchMonographPublication(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await monographPublicationInterface.searchMonographPublication(req.body);
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}
