function notFound(req, res, next) {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl
  });
}

function errorHandler(error, req, res, next) {
  console.error("Unhandled error:", error);

  res.status(error.statusCode || 500).json({
    error: error.message || "Internal server error",
    ...(process.env.NODE_ENV !== "production" ? { stack: error.stack } : {})
  });
}

module.exports = {
  notFound,
  errorHandler
};
