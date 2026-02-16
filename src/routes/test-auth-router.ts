import { Router, type Request, type Response } from 'express';
import HttpStatus from 'http-status';

/**
 * Test authentication router. DO NOT USE ANYWHERE ELSE BUT IN AUTOMATED TESTS!
 */
const testAuthenticationRouter = Router();
testAuthenticationRouter.post('/', authenticateTest);

export default testAuthenticationRouter;

// Exception that proves the rule: controller is here instead of within src/controllers
function authenticateTest(req: Request, res: Response) {
  return res.status(HttpStatus.OK).json({ accessToken: req.user });
}
