import type { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

import * as monographPublisherRequestInterface from '../../interfaces/monograph/monograph-publisher-request-interface.ts';

export async function createMonographPublisherRequest(req: Request, res: Response, next: NextFunction) {
  try {
    await monographPublisherRequestInterface.createMonographPublisherRequest(req.body, req.user);
    return res.status(HttpStatus.CREATED).end();
  } catch (error) {
    return next(error);
  }
}

export async function readMonographPublisherRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await monographPublisherRequestInterface.readMonographPublisherRequest(Number(req.params['id']));
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function updateMonographPublisherRequest(req: Request, res: Response, next: NextFunction) {
  try {
    await monographPublisherRequestInterface.updateMonographPublisherRequest(
      Number(req.params['id']),
      req.body,
      req.user,
    );
    return res.status(HttpStatus.NO_CONTENT).end();
  } catch (error) {
    return next(error);
  }
}

export async function searchMonographPublisherRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await monographPublisherRequestInterface.searchMonographPublisherRequest(req.body);
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}
