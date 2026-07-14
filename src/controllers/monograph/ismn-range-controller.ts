import type { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

import * as ismnRangeInterface from '../../interfaces/monograph/ismn-range-interface.ts';

export async function readIsmnRanges(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await ismnRangeInterface.getIsmnRanges();
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function readIsmnRange(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await ismnRangeInterface.readIsmnRange(Number(req.params['id']));
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function createIsmnRange(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await ismnRangeInterface.createIsmnRange(req.body, req.user);
    return res.status(HttpStatus.CREATED).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function updateIsmnRange(req: Request, res: Response, next: NextFunction) {
  try {
    await ismnRangeInterface.updateIsmnRange(Number(req.params['id']), req.body, req.user);
    return res.status(HttpStatus.NO_CONTENT).end();
  } catch (error) {
    return next(error);
  }
}

export async function deleteIsmnRange(req: Request, res: Response, next: NextFunction) {
  try {
    await ismnRangeInterface.deleteIsmnRange(Number(req.params['id']));
    return res.status(HttpStatus.NO_CONTENT).end();
  } catch (error) {
    return next(error);
  }
}
