import { Hono } from 'hono';
import { html } from 'hono/html';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load CSS once at startup
// Try multiple paths to handle both dev (src/) and prod (dist/) environments
let inlineCSS: string;
const cssPaths = [
  join(__dirname, '../../client/styles.css'),      // dev: src/server/routes -> src/client
  join(__dirname, '../../../src/client/styles.css'), // prod: dist/server/routes -> src/client
];

inlineCSS = '/* CSS not found */';
for (const cssPath of cssPaths) {
  if (existsSync(cssPath)) {
    try {
      inlineCSS = readFileSync(cssPath, 'utf-8');
      break;
    } catch {
      // Continue to next path
    }
  }
}

export const pageRoutes = new Hono();

/**
 * GET /send - Mobile sender page
 */
pageRoutes.get('/send', (c) => {
  return c.html(html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Text Portal - Send</title>
  <style>${inlineCSS}</style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Text Portal</h1>
      <p class="subtitle">Send text securely to any computer</p>
    </header>

    <!-- Input Form -->
    <div id="input-form">
      <div class="form-group">
        <label for="content">Enter your text</label>
        <textarea id="content" placeholder="Paste or type your text here..." maxlength="50000"></textarea>
      </div>
      <button type="button" id="generate-btn" class="btn btn-primary">Generate Code</button>
      <div id="error-message" class="message message-error hidden"></div>
    </div>

    <!-- Result Display -->
    <div id="result" class="hidden">
      <div class="result">
        <p>Your code:</p>
        <div id="code-display" class="code-display"></div>
        <p id="timer" class="timer">Expires in <span id="countdown">10:00</span></p>
      </div>

      <div class="qr-container">
        <img id="qr-code" class="qr-code" alt="QR Code" />
      </div>

      <button type="button" id="send-another-btn" class="btn btn-secondary">Send Another</button>
    </div>

    <footer>
      <p>Content is encrypted and auto-deleted after first access or 10 minutes</p>
    </footer>
  </div>

  <script>
    (function() {
      const form = document.getElementById('input-form');
      const result = document.getElementById('result');
      const content = document.getElementById('content');
      const generateBtn = document.getElementById('generate-btn');
      const errorMessage = document.getElementById('error-message');
      const codeDisplay = document.getElementById('code-display');
      const countdown = document.getElementById('countdown');
      const qrCode = document.getElementById('qr-code');
      const sendAnotherBtn = document.getElementById('send-another-btn');
      const timer = document.getElementById('timer');

      let countdownInterval = null;
      let expiresAt = null;

      function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
      }

      function hideError() {
        errorMessage.classList.add('hidden');
      }

      function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins + ':' + secs.toString().padStart(2, '0');
      }

      function updateCountdown() {
        if (!expiresAt) return;

        const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        countdown.textContent = formatTime(remaining);

        if (remaining <= 60) {
          timer.classList.add('warning');
        }

        if (remaining <= 0) {
          clearInterval(countdownInterval);
          countdown.textContent = 'Expired';
        }
      }

      function startCountdown(expiresAtMs) {
        expiresAt = expiresAtMs;
        updateCountdown();
        countdownInterval = setInterval(updateCountdown, 1000);
      }

      function stopCountdown() {
        if (countdownInterval) {
          clearInterval(countdownInterval);
          countdownInterval = null;
        }
        expiresAt = null;
        timer.classList.remove('warning');
      }

      function showResult(data) {
        form.classList.add('hidden');
        result.classList.remove('hidden');

        codeDisplay.textContent = data.code;
        qrCode.src = data.qrDataUrl;

        startCountdown(data.expiresAt);
      }

      function showForm() {
        stopCountdown();
        result.classList.add('hidden');
        form.classList.remove('hidden');
        content.value = '';
        hideError();
      }

      async function generateCode() {
        const text = content.value.trim();

        if (!text) {
          showError('Please enter some text');
          return;
        }

        hideError();
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<span class="spinner"></span> Generating...';

        try {
          const response = await fetch('/api/entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: text })
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to generate code');
          }

          showResult(data);
        } catch (error) {
          showError(error.message || 'Connection failed. Please try again.');
        } finally {
          generateBtn.disabled = false;
          generateBtn.textContent = 'Generate Code';
        }
      }

      generateBtn.addEventListener('click', generateCode);
      sendAnotherBtn.addEventListener('click', showForm);
    })();
  </script>
</body>
</html>`);
});

/**
 * GET / - Desktop receiver page (root)
 */
pageRoutes.get('/', (c) => {
  return c.html(html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Text Portal</title>
  <style>${inlineCSS}</style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Text Portal</h1>
      <p class="subtitle">Enter code to retrieve text</p>
    </header>

    <!-- Code Entry Form -->
    <div id="code-form">
      <div class="form-group" style="text-align: center;">
        <label for="code">Enter 6-digit code</label>
        <input type="text" id="code" class="code-input" maxlength="6" pattern="[0-9]{6}" inputmode="numeric" autocomplete="off" />
      </div>
      <button type="button" id="retrieve-btn" class="btn btn-primary">Retrieve Text</button>
      <div id="error-message" class="message message-error hidden"></div>
    </div>

    <!-- Content Display -->
    <div id="content-display" class="hidden">
      <div class="content-display" id="retrieved-content"></div>
      <button type="button" id="copy-btn" class="btn btn-success">Copy to Clipboard</button>
      <div id="copy-success" class="message message-success hidden">Copied to clipboard!</div>
      <button type="button" id="another-btn" class="btn btn-secondary" style="margin-top: 1rem;">Enter Another Code</button>
    </div>

    <footer>
      <p>Content is encrypted and deleted after retrieval</p>
    </footer>
  </div>

  <script>
    (function() {
      const codeForm = document.getElementById('code-form');
      const contentDisplay = document.getElementById('content-display');
      const codeInput = document.getElementById('code');
      const retrieveBtn = document.getElementById('retrieve-btn');
      const errorMessage = document.getElementById('error-message');
      const retrievedContent = document.getElementById('retrieved-content');
      const copyBtn = document.getElementById('copy-btn');
      const copySuccess = document.getElementById('copy-success');
      const anotherBtn = document.getElementById('another-btn');

      function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
      }

      function hideError() {
        errorMessage.classList.add('hidden');
      }

      function showContent(text) {
        codeForm.classList.add('hidden');
        contentDisplay.classList.remove('hidden');
        retrievedContent.textContent = text;
      }

      function showForm() {
        contentDisplay.classList.add('hidden');
        codeForm.classList.remove('hidden');
        codeInput.value = '';
        copySuccess.classList.add('hidden');
        hideError();
        codeInput.focus();
      }

      async function retrieveContent() {
        const code = codeInput.value.trim();

        if (!/^[0-9]{6}$/.test(code)) {
          showError('Please enter a 6-digit code');
          return;
        }

        hideError();
        retrieveBtn.disabled = true;
        retrieveBtn.innerHTML = '<span class="spinner"></span> Retrieving...';

        try {
          const response = await fetch('/api/entries/' + code);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Code not found');
          }

          showContent(data.content);
        } catch (error) {
          showError(error.message || 'Connection failed. Please try again.');
        } finally {
          retrieveBtn.disabled = false;
          retrieveBtn.textContent = 'Retrieve Text';
        }
      }

      async function copyToClipboard() {
        try {
          await navigator.clipboard.writeText(retrievedContent.textContent);
          copySuccess.classList.remove('hidden');
          setTimeout(function() {
            copySuccess.classList.add('hidden');
          }, 3000);
        } catch (error) {
          // Fallback for older browsers
          const textarea = document.createElement('textarea');
          textarea.value = retrievedContent.textContent;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          copySuccess.classList.remove('hidden');
          setTimeout(function() {
            copySuccess.classList.add('hidden');
          }, 3000);
        }
      }

      // Auto-submit on 6 digits
      codeInput.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (this.value.length === 6) {
          retrieveContent();
        }
      });

      retrieveBtn.addEventListener('click', retrieveContent);
      copyBtn.addEventListener('click', copyToClipboard);
      anotherBtn.addEventListener('click', showForm);

      // Focus on code input
      codeInput.focus();
    })();
  </script>
</body>
</html>`);
});

/**
 * GET /:code - Direct link access (6-digit code in URL)
 */
pageRoutes.get('/:code{[0-9]{6}}', async (c) => {
  const code = c.req.param('code');

  // We'll render the page with the code pre-filled and auto-retrieve
  return c.html(html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Text Portal</title>
  <style>${inlineCSS}</style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Text Portal</h1>
      <p class="subtitle">Retrieving your text...</p>
    </header>

    <!-- Loading State -->
    <div id="loading" class="result">
      <span class="spinner"></span>
      <p>Loading...</p>
    </div>

    <!-- Error State -->
    <div id="error-display" class="hidden">
      <div class="message message-error" id="error-message"></div>
      <a href="/" class="btn btn-secondary" style="margin-top: 1rem; display: block;">Enter Another Code</a>
    </div>

    <!-- Content Display -->
    <div id="content-display" class="hidden">
      <div class="content-display" id="retrieved-content"></div>
      <button type="button" id="copy-btn" class="btn btn-success">Copy to Clipboard</button>
      <div id="copy-success" class="message message-success hidden">Copied to clipboard!</div>
      <a href="/" class="btn btn-secondary" style="margin-top: 1rem; display: block;">Enter Another Code</a>
    </div>

    <footer>
      <p>Content is encrypted and deleted after retrieval</p>
    </footer>
  </div>

  <script>
    (function() {
      const code = '${code}';
      const loading = document.getElementById('loading');
      const errorDisplay = document.getElementById('error-display');
      const errorMessage = document.getElementById('error-message');
      const contentDisplay = document.getElementById('content-display');
      const retrievedContent = document.getElementById('retrieved-content');
      const copyBtn = document.getElementById('copy-btn');
      const copySuccess = document.getElementById('copy-success');

      async function retrieveContent() {
        try {
          const response = await fetch('/api/entries/' + code);
          const data = await response.json();

          loading.classList.add('hidden');

          if (!response.ok) {
            errorMessage.textContent = data.error || 'Code not found or expired';
            errorDisplay.classList.remove('hidden');
            return;
          }

          retrievedContent.textContent = data.content;
          contentDisplay.classList.remove('hidden');
        } catch (error) {
          loading.classList.add('hidden');
          errorMessage.textContent = 'Connection failed. Please try again.';
          errorDisplay.classList.remove('hidden');
        }
      }

      async function copyToClipboard() {
        try {
          await navigator.clipboard.writeText(retrievedContent.textContent);
          copySuccess.classList.remove('hidden');
          setTimeout(function() {
            copySuccess.classList.add('hidden');
          }, 3000);
        } catch (error) {
          const textarea = document.createElement('textarea');
          textarea.value = retrievedContent.textContent;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          copySuccess.classList.remove('hidden');
          setTimeout(function() {
            copySuccess.classList.add('hidden');
          }, 3000);
        }
      }

      copyBtn.addEventListener('click', copyToClipboard);
      retrieveContent();
    })();
  </script>
</body>
</html>`);
});
