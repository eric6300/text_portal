import type { Context, Next } from 'hono';

/**
 * Security headers middleware
 * Adds CSP, HSTS, X-Frame-Options, and other security headers
 */
export async function securityHeaders(c: Context, next: Next): Promise<Response> {
  await next();

  // Content Security Policy - no external resources
  c.res.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'"
  );

  // Strict Transport Security (HTTPS)
  c.res.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );

  // Prevent clickjacking
  c.res.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  c.res.headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer policy
  c.res.headers.set('Referrer-Policy', 'no-referrer');

  // Permissions policy - disable unnecessary features
  c.res.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=()'
  );

  return c.res;
}

/**
 * Get client IP from request
 * Handles common proxy headers
 */
export function getClientIP(c: Context): string {
  // Check common proxy headers
  const xForwardedFor = c.req.header('x-forwarded-for');
  if (xForwardedFor) {
    // Take first IP in chain
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIP = c.req.header('x-real-ip');
  if (xRealIP) {
    return xRealIP;
  }

  // Fallback - use a placeholder since Hono doesn't expose raw IP
  return '0.0.0.0';
}
