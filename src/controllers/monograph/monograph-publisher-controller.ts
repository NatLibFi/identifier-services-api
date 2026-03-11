import type { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

import * as monographPublisherInterface from '../../interfaces/monograph/monograph-publisher-interface.ts';

export async function createMonographPublisher(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await monographPublisherInterface.createMonographPublisher(req.body, req.user);
    return res.status(HttpStatus.CREATED).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function readMonographPublisher(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await monographPublisherInterface.readMonographPublisher(Number(req.params['id']), req.user);
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function deleteMonographPublisher(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await monographPublisherInterface.deleteMonographPublisher(Number(req.params['id']));
    return res.status(HttpStatus.NO_CONTENT).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function updateMonographPublisher(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await monographPublisherInterface.updateMonographPublisher(
      Number(req.params['id']),
      req.body,
      req.user,
    );
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function searchMonographPublisher(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await monographPublisherInterface.searchMonographPublisher(req.body, req.user);
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}
