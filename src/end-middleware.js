export function endMiddleware(req, res, next) {

  if (!res._orig_end_handler) {

    res._orig_end_handler = res.end;

    res.end = function () {
      res.end = res._orig_end_handler;
      res.emit('end');
      res.end.apply(this, arguments);
    };

  }

  next();

};