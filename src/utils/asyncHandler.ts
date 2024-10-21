import { Request, Response, NextFunction, RequestHandler } from 'express'

// Make asyncHandler generic to support different request types
const asyncHandler = <T extends Request = Request>(
  requestHandler: (
    req: T,
    res: Response,
    next: NextFunction,
  ) => Promise<unknown>,
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(requestHandler(req as T, res, next)).catch(err => next(err))
  }
}

export { asyncHandler }
