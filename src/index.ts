import { NextFunction, Request, Response } from 'express'
import queue, { Options, QueueWorker, QueueWorkerCallback } from 'queue'
import { endMiddleware } from './end-middleware'

interface JobData {
  res: Response,
  next: NextFunction
}

function createExpressJob(data: JobData): QueueWorker {
  return (callback?: QueueWorkerCallback) => {
    return new Promise<boolean>((resolve, reject) => {
      data.res.once('end', function () {     // `end` event is sent on res.end() by `express-end` middleware package
        return resolve(true)
      });
      data.res.once('close', function () {
        return resolve(false)
      });
      data.next()
    })
  }
}

export const expressQueueMiddleware = function (config?: Options) {

  const q = queue(config);
  q.autostart = true

  const queueMiddleware = function (req: Request, res: Response, next: NextFunction) {
    
    const data = { res: res, next: next };
    const job = createExpressJob(data)
    q.push(job)
  
  };

  // merge `end` and `queue` middlewares
  const middleware = (req: Request, res: Response, next: NextFunction) => {
    endMiddleware(req, res, () => {     // Inject res.end() handler to emit 'end' event
      queueMiddleware(req, res, next); // Use this middleware
    });
  };

  // expose queue
  middleware.queue = q

  return middleware;
};