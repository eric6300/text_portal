# Quickstart: Text-to-Link Bridge

**Feature**: 001-text-portal
**Date**: 2026-01-08

## User Scenarios

### Scenario 1: Mobile to Desktop Text Transfer

**Actor**: Physician with mobile phone and nursing station computer

```
Mobile Device                         Desktop Computer
─────────────                         ─────────────────
1. Open /send page
2. Enter or paste text
3. Tap "Generate Code"
4. See code "482916" displayed
5. Walk to nursing station
                                      6. Open root page /
                                      7. Enter "482916"
                                      8. See text displayed
                                      9. Click "Copy to Clipboard"
                                      10. Paste into medical records
```

### Scenario 2: QR Code Transfer (Alternative)

**Actor**: Physician using QR scanner on desktop

```
Mobile Device                         Desktop Computer
─────────────                         ─────────────────
1. Open /send page
2. Enter text
3. Tap "Generate Code"
4. QR code displayed on screen
                                      5. Scan QR with webcam/scanner
                                      6. Browser opens /482916
                                      7. Text displayed immediately
                                      8. Click "Copy to Clipboard"
```

### Scenario 3: Direct Link Sharing

**Actor**: User sharing link via messaging app

```
Mobile Device A                       Mobile/Desktop Device B
───────────────                       ──────────────────────
1. Open /send page
2. Enter text
3. Tap "Generate Code"
4. Copy link "example.com/482916"
5. Send via messaging app
                                      6. Click received link
                                      7. Text displayed
                                      8. Copy to clipboard
```

## API Integration Examples

### Create Entry (curl)

```bash
curl -X POST https://example.com/api/entries \
  -H "Content-Type: application/json" \
  -d '{"content": "Patient presents with mild fever and cough."}'
```

Response:
```json
{
  "code": "482916",
  "expiresAt": 1736380800000,
  "expiresIn": 600,
  "qrDataUrl": "data:image/png;base64,iVBORw0KGgo...",
  "retrievalUrl": "https://example.com/482916"
}
```

### Retrieve Entry (curl)

```bash
curl https://example.com/api/entries/482916
```

Response:
```json
{
  "content": "Patient presents with mild fever and cough."
}
```

### Create Entry (JavaScript/fetch)

```javascript
async function createEntry(text) {
  const response = await fetch('/api/entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: text })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}

// Usage
const { code, qrDataUrl, expiresIn } = await createEntry('Hello from mobile!');
console.log(`Code: ${code}, expires in ${expiresIn} seconds`);
```

### Retrieve Entry (JavaScript/fetch)

```javascript
async function retrieveEntry(code) {
  const response = await fetch(`/api/entries/${code}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}

// Usage
const { content } = await retrieveEntry('482916');
console.log(`Retrieved: ${content}`);
```

## Page Flows

### Mobile Sender Page (`/send`)

```
┌─────────────────────────────────┐
│  Text Portal - Send            │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │  Enter your text here   │   │
│  │  ...                    │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  [ Generate Code ]              │
│                                 │
└─────────────────────────────────┘

          ↓ After submission

┌─────────────────────────────────┐
│  Text Portal - Send            │
├─────────────────────────────────┤
│                                 │
│  Your code:                     │
│                                 │
│     ╔═════════════════════╗    │
│     ║    4 8 2 9 1 6      ║    │
│     ╚═════════════════════╝    │
│                                 │
│  Expires in: 9:45               │
│                                 │
│  ┌─────────────┐               │
│  │   [QR CODE] │               │
│  │             │               │
│  └─────────────┘               │
│                                 │
│  [ Send Another ]               │
│                                 │
└─────────────────────────────────┘
```

### Desktop Receiver Page (`/`)

```
┌─────────────────────────────────────────┐
│  Text Portal                            │
├─────────────────────────────────────────┤
│                                         │
│  Enter 6-digit code:                    │
│                                         │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐   │
│  │   │ │   │ │   │ │   │ │   │ │   │   │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘   │
│                                         │
│  [ Retrieve Text ]                      │
│                                         │
└─────────────────────────────────────────┘

          ↓ After successful retrieval

┌─────────────────────────────────────────┐
│  Text Portal                            │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │  Patient presents with mild    │   │
│  │  fever and cough. Recommend    │   │
│  │  rest and fluids.              │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [ Copy to Clipboard ]  ✓ Copied!      │
│                                         │
│  [ Enter Another Code ]                 │
│                                         │
└─────────────────────────────────────────┘
```

## Error Handling

### User-Facing Errors

| Situation | Message | Recovery |
|-----------|---------|----------|
| Empty content | "Please enter some text" | Fill in text field |
| Content too long | "Text is too long (max 50,000 characters)" | Shorten content |
| Rate limited | "Please wait a moment before trying again" | Wait ~30 seconds |
| Invalid code format | "Please enter a 6-digit code" | Correct input |
| Code not found | "Code not found or expired" | Get new code from sender |
| Network error | "Connection failed. Please try again." | Retry |

### Security Notes for Integration

1. **One-time access**: Retrieved content is immediately deleted. There is no way to retrieve it again.
2. **No authentication**: The API is intentionally unauthenticated. Access control is via the secret code.
3. **Short TTL**: Codes expire after 10 minutes. Plan workflows accordingly.
4. **No logging**: Content and codes are never logged. If lost, they cannot be recovered.
5. **Rate limits**: 10 creates/min, 5 retrieves/min per IP. Build in retry logic with backoff.
