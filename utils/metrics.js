// Prometheus metrics collection for School Fees Manager
const promClient = require('prom-client');

// Create custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const databaseQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1]
});

const databaseQueryErrors = new promClient.Counter({
  name: 'database_query_errors_total',
  help: 'Total number of database query errors',
  labelNames: ['operation', 'table', 'error_type']
});

const activeConnections = new promClient.Gauge({
  name: 'active_database_connections',
  help: 'Number of active database connections'
});

// Middleware to track HTTP request metrics
function metricsMiddleware(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    httpRequestDuration.labels(req.method, route, res.statusCode).observe(duration);
    httpRequestTotal.labels(req.method, route, res.statusCode).inc();
  });
  next();
}

// Metrics endpoint for Prometheus scraper
function metricsEndpoint(req, res) {
  res.set('Content-Type', promClient.register.contentType);
  res.end(promClient.register.metrics());
}

// Helper to track database operations
function trackDatabaseOperation(operation, table, duration, error = null) {
  databaseQueryDuration.labels(operation, table).observe(duration / 1000);
  if (error) {
    databaseQueryErrors.labels(operation, table, error.name).inc();
  }
}

function updateActiveConnections(count) {
  activeConnections.set(count);
}

module.exports = {
  metricsMiddleware,
  metricsEndpoint,
  trackDatabaseOperation,
  updateActiveConnections,
  httpRequestDuration,
  httpRequestTotal,
  databaseQueryDuration,
  databaseQueryErrors,
  activeConnections
};
