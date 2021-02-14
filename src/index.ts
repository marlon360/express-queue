import { NextFunction, Request, Response } from 'express'
import { endMiddleware } from './end-middleware'
import MiniQueue from 'mini-queue'

/**
 * Data that is needed for the job in the queue
 */
interface JobData {
  res: Response,
  next: NextFunction
}

/**
 * Settings for the queue
 */
interface QueueSettings {
  activeLimit?: number,
  queuedLimit?: number
}

export const expressQueueMiddleware = function (config: QueueSettings = {}) {

  /**
   * Initialize new queue
   */
  const q = new MiniQueue(config)

  q.on('process', (job: { data: JobData }, done: any) => {
    job.data.res.once('end', function () {     // `end` event is sent on res.end() by `express-end` middleware package
      return done()
    });
    job.data.next()
  })

  /**
   * This middleware takes the request data and adds them to the queue
   * 
   * @param req Express Request
   * @param res Express Response
   * @param next Express Next Function
   */
  const queueMiddleware = function (req: Request, res: Response, next: NextFunction) {

    const data = { res: res, next: next };
    const job = q.createJob(data);

    // Handle disconnect from client while in queue
    res.once('close', function () {
      if (job.status === 'queue') {
        q._cancelJob(job);
      }
    });

  };

  /**
   * Merge End Middleware and Queue Middleware.
   * The End Middleware is needed to notify the queue when a job is done
   * 
   * @param req Express Request
   * @param res Express Response
   * @param next Express Next Function
   */
  const middleware = (req: Request, res: Response, next: NextFunction) => {
    endMiddleware(req, res, () => {
      queueMiddleware(req, res, next);
    });
  };

  /**
   * Expose queue object to the outside
   */
  middleware.queue = q

  return middleware;
};