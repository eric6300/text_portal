import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { securityHeaders } from './middleware/security.js';
import { startEntryCleanup } from './services/entry-store.js';
import { startRateLimitCleanup } from './services/rate-limiter.js';
import { config } from './config.js';
import { apiRoutes } from './routes/api.js';
import { pageRoutes } from './routes/pages.js';

const app = new Hono();

// Apply security headers to all responses
app.use('*', securityHeaders);

// Mount API routes
app.route('/api', apiRoutes);

// Mount page routes
app.route('/', pageRoutes);

// Start background cleanup processes
startEntryCleanup();
startRateLimitCleanup();

// Start server
console.log(`Text Portal starting on port ${config.port}...`);
console.log(`Base URL: ${config.baseUrl}`);
console.log(`Environment: ${config.nodeEnv}`);

serve({
  fetch: app.fetch,
  port: config.port,
});

console.log(`Server running at http://localhost:${config.port}`);

export { app };
