import type { Request, Response, NextFunction } from 'express';

export interface RequestUser {
  id: string;
  name: string;
  applicationRoles?: string[];
  roles?: string[];
}

export type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// Expand Request type so that it may include user information
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    export interface Request {
      user: RequestUser;
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UnknownObject = Record<string, any>;
