import type { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

import * as monographPublicationManifestationInterface from '../../interfaces/monograph/monograph-publication-manifestation-interface.ts';

export async function updateMonographPublicationManifestation(req: Request, res: Response, next: NextFunction) {
  try {
    await monographPublicationManifestationInterface.updateMonographPublicationManifestation(
      Number(req.params['id']),
      req.body,
      req.user,
    );
    return res.status(HttpStatus.NO_CONTENT).end();
  } catch (error) {
    return next(error);
  }
}

export async function assignManifestationIdentifier(req: Request, res: Response, next: NextFunction) {
  try {
    await monographPublicationManifestationInterface.assignManifestationIdentifier(Number(req.params['id']), req.user);
    return res.status(HttpStatus.NO_CONTENT).end();
  } catch (error) {
    return next(error);
  }
}

export async function deassignManifestationIdentifier(req: Request, res: Response, next: NextFunction) {
  try {
    await monographPublicationManifestationInterface.deassignManifestationIdentifier(
      Number(req.params['id']),
      req.user,
    );
    return res.status(HttpStatus.NO_CONTENT).end();
  } catch (error) {
    return next(error);
  }
}
