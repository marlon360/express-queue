import { NextFunction, Request, Response } from 'express'
import queue, { Options, QueueWorker, QueueWorkerCallback } from 'queue'
import { endMiddleware } from './end-middleware'

/**
 * Data that is needed for the job in the queue
 */
interface JobData {
  res: Response,
  next: NextFunction
}

/**
 * This method creates the job for the queue.
 * 
 * @param data The Express Response and Next object
 */

function createExpressJob(data: JobData): QueueWorker {
  return (callback?: QueueWorkerCallback) => {
    return new Promise<boolean>((resolve, reject) => {
      data.res.once('end', function () {     // `end` event is sent on res.end() by `express-end` middleware package
        return resolve(true)
      });
      data.next()
    })
  }
}

export const expressQueueMiddleware = function (config?: Options) {

  /**
   * Initialize new queue and enable autostart
   */
  const q = queue(config);
  q.autostart = true

  /**
   * This middleware takes the request data and adds them to the queue
   * 
   * @param req Express Request
   * @param res Express Response
   * @param next Express Next Function
   */
  const queueMiddleware = function (req: Request, res: Response, next: NextFunction) {
    
    const data = { res: res, next: next };
    const job = createExpressJob(data)
    q.push(job)

    // when client closes the connection
    res.once('close', function () {
      // check if job is still queued
      const jobIndex = q.indexOf(job)
      if (jobIndex > -1) {
        // remove from queue
        q.splice(jobIndex)
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