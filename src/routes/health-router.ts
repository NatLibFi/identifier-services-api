import { Router, type Request, type Response } from 'express';
import HttpStatus from 'http-status';

const healthRouter = Router();
healthRouter.get('/', (_req: Request, res: Response) => res.status(HttpStatus.OK).end());

export default healthRouter;
