import { Hono } from 'hono';
import QRCode from 'qrcode';
import type { CreateEntryRequest, CreateEntryResponse, GetEntryResponse, ErrorResponse } from '../../shared/types.js';
import { createEntry, retrieveAndDeleteEntry } from '../services/entry-store.js';
import { isValidCodeFormat } from '../services/code-generator.js';
import { checkCreateLimit, checkRetrieveLimit } from '../services/rate-limiter.js';
import { getClientIP } from '../middleware/security.js';
import { config } from '../config.js';

export const apiRoutes = new Hono();

/**
 * POST /api/entries - Create a new text entry
 */
apiRoutes.post('/entries', async (c) => {
  // Rate limiting
  const clientIP = getClientIP(c);
  if (!checkCreateLimit(clientIP)) {
    return c.json<ErrorResponse>(
      { error: 'Too many requests. Please wait before trying again.' },
      429
    );
  }

  // Parse request body
  let body: CreateEntryRequest;
  try {
    body = await c.req.json();
  } catch {
    return c.json<ErrorResponse>({ error: 'Invalid JSON' }, 400);
  }

  // Validate content
  if (!body.content || typeof body.content !== 'string') {
    return c.json<ErrorResponse>({ error: 'Content is required' }, 400);
  }

  const content = body.content.trim();
  if (content.length === 0) {
    return c.json<ErrorResponse>({ error: 'Content is required' }, 400);
  }

  if (content.length > config.maxContentLength) {
    return c.json<ErrorResponse>(
      { error: `Content exceeds maximum length of ${config.maxContentLength} characters` },
      400
    );
  }

  // Create entry
  let result: { code: string; expiresAt: number };
  try {
    result = createEntry(content);
  } catch (error) {
    return c.json<ErrorResponse>(
      { error: 'Service temporarily unavailable. Please try again.' },
      503
    );
  }

  const { code, expiresAt } = result;
  const expiresIn = Math.floor((expiresAt - Date.now()) / 1000);
  const retrievalUrl = `${config.baseUrl}/${code}`;

  // Generate QR code as data URL
  let qrDataUrl: string;
  try {
    qrDataUrl = await QRCode.toDataURL(retrievalUrl, {
      width: 200,
      margin: 2,
      errorCorrectionLevel: 'M',
    });
  } catch {
    qrDataUrl = '';
  }

  const response: CreateEntryResponse = {
    code,
    expiresAt,
    expiresIn,
    qrDataUrl,
    retrievalUrl,
  };

  return c.json(response, 201);
});

/**
 * GET /api/entries/:code - Retrieve and delete a text entry
 */
apiRoutes.get('/entries/:code', async (c) => {
  const code = c.req.param('code');

  // Validate code format
  if (!isValidCodeFormat(code)) {
    return c.json<ErrorResponse>({ error: 'Invalid code format' }, 400);
  }

  // Rate limiting
  const clientIP = getClientIP(c);
  if (!checkRetrieveLimit(clientIP)) {
    return c.json<ErrorResponse>(
      { error: 'Too many requests. Please wait before trying again.' },
      429
    );
  }

  // Retrieve and delete entry
  const content = retrieveAndDeleteEntry(code);

  if (content === null) {
    // Generic error message for security (don't reveal if expired vs never existed)
    return c.json<ErrorResponse>({ error: 'Code not found' }, 404);
  }

  const response: GetEntryResponse = { content };
  return c.json(response);
});
