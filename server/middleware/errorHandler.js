const logger = require('../config/logger');
const isDev = process.env.NODE_ENV !== 'production';

module.exports = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Server error';
  let details = err.details;

  if (err.code === 11000) {
    status = 409;
    message = 'Duplicate record';
  } else if (err.name === 'ValidationError') {
    status = 422;
    details = err.errors;
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid ID format';
  } else if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired';
  }

  const logContext = {
    method: req.method,
    path: req.path,
    statusCode: status,
    userId: req.user?._id,
    errorName: err.name,
  };

  if (status >= 500) {
    logger.error(message, err, logContext);
  } else {
    logger.warn(message, logContext);
  }

  const response = {
    success: false,
    message,
  };

  if (details) response.details = details;
  if (isDev && status >= 500) response.stack = err.stack;

  res.status(status).json(response);
};
