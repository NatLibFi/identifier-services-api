import type { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

import * as serialPublisherInterface from '../../interfaces/serial/serial-publisher-interface.ts';

export async function readSerialPublisher(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await serialPublisherInterface.readSerialPublisher(Number(req.params['id']));
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function createSerialPublisher(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await serialPublisherInterface.createSerialPublisher(req.body, req.user);
    return res.status(HttpStatus.CREATED).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function updateSerialPublisher(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await serialPublisherInterface.updateSerialPublisher(Number(req.params['id']), req.body, req.user);
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function deleteSerialPublisher(req: Request, res: Response, next: NextFunction) {
  try {
    await serialPublisherInterface.deleteSerialPublisher(Number(req.params['id']));
    return res.status(HttpStatus.NO_CONTENT).end();
  } catch (error) {
    return next(error);
  }
}

export async function searchSerialPublisher(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await serialPublisherInterface.searchSerialPublisher(req.body);
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function serialPublisherAutocomplete(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await serialPublisherInterface.serialPublisherAutocomplete(req.body['search_text']);
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}
