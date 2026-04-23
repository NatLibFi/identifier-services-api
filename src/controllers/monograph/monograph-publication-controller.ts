import type { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

import * as monographPublicationInterface from '../../interfaces/monograph/monograph-publication-interface.ts';

import { ApiError } from '../../utils/api-error.ts';

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

export async function mergeMonographPublication(req: Request, res: Response, next: NextFunction) {
  try {
    const incomingMonographPublicationId = Number(req.body['incoming_monograph_publication_id']);
    if (!incomingMonographPublicationId || isNaN(incomingMonographPublicationId)) {
      throw new ApiError(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Unprocessable entity',
        'Invalid definition for incoming monograph publication request id',
      );
    }

    const result = await monographPublicationInterface.mergeMonographPublication(
      Number(req.params['id']),
      incomingMonographPublicationId,
      req.user,
    );

    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}
