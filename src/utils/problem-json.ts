import type { Request, Response } from 'express';

interface ProblemJsonObject {
  status: number;
  type: string;
  title: string;
  detail: string;
}

/**
 * Generates JSON object representation of problem document based on description in https://datatracker.ietf.org/doc/html/rfc9457 .
 * RFC Copyright: Copyright (c) 2023 IETF Trust and the persons identified as the document authors. All rights reserved.
 */
export default function respondWithProblemDocument(req: Request, res: Response, problemDocument: ProblemJsonObject) {
  const { type, status, title, detail } = problemDocument;

  const result = {
    type,
    status,
    title,
    detail,
    instance: req.path,
  };

  res.set('Content-Type', 'application/problem+json');
  return res.status(status).json(result);
}
