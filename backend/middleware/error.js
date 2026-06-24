export function errorHandler(err, req, res, next) {
  console.error('Error details:', err.stack || err.message || err);

  const status = err.status || 500;
  const message = err.message || 'An unexpected server error occurred';

  res.status(status).json({
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}
