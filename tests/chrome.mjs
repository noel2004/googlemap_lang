import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

export const extensionRoot = resolve(import.meta.dirname, '..');
export const extensionId = [...createHash('sha256').update(extensionRoot).digest('hex').slice(0, 32)]
  .map(character => String.fromCharCode(97 + parseInt(character, 16))).join('');

export async function launch({ locale = 'en', profile = mkdtempSync(join(tmpdir(), 'maps-language-test-')) } = {}) {
  const executable = process.env.CHROME_BIN;
  if (!executable) throw new Error('Set CHROME_BIN to an extension-capable Chromium / Chrome for Testing executable.');
  const args = ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-background-networking', `--lang=${locale}`, `--user-data-dir=${profile}`,
    `--disable-extensions-except=${extensionRoot}`, `--load-extension=${extensionRoot}`, '--remote-debugging-port=0', 'about:blank'];
  if (process.env.CHROME_NO_SANDBOX === '1') args.push('--no-sandbox');
  const child = spawn(executable, args, { env: { ...process.env, LANGUAGE: locale, LANG: `${locale.replace('-', '_')}.UTF-8` }, stdio: ['ignore', 'ignore', 'pipe'] });
  let socket;
  try {
    const endpoint = await new Promise((resolve, reject) => {
      let log = '';
      const timeout = setTimeout(() => reject(new Error(`Browser startup timed out: ${log}`)), 15000);
      child.once('error', error => { clearTimeout(timeout); reject(error); });
      child.once('exit', () => { clearTimeout(timeout); reject(new Error(log)); });
      child.stderr.on('data', data => {
        log += data;
        const match = log.match(/DevTools listening on (ws:\/\/[^\s]+)/);
        if (match) { clearTimeout(timeout); resolve(match[1]); }
      });
    });
    socket = new WebSocket(endpoint);
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
    let sequence = 0;
    const pending = new Map();
    const listeners = new Set();
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const item = pending.get(message.id);
        if (!item) return;
        clearTimeout(item.timeout);
        pending.delete(message.id);
        if (message.error) item.reject(new Error(JSON.stringify(message.error)));
        else item.resolve(message.result);
      } else {
        for (const listener of listeners) listener(message);
      }
    });
    const call = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
      const id = ++sequence;
      const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 15000);
      pending.set(id, { resolve, reject, timeout });
      socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
    async function page(targetId) {
      if (!targetId) ({ targetId } = await call('Target.createTarget', { url: 'about:blank' }));
      const { sessionId } = await call('Target.attachToTarget', { targetId, flatten: true });
      const command = (method, params) => call(method, params, sessionId);
      await command('Page.enable');
      await command('Runtime.enable');
      const errors = [];
      listeners.add(message => {
        if (message.sessionId !== sessionId) return;
        if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
        if (message.method === 'Fetch.requestPaused') void command('Fetch.fulfillRequest', {
          requestId: message.params.requestId, responseCode: 200,
          responseHeaders: [{ name: 'Content-Type', value: 'text/html' }],
          body: Buffer.from('<!doctype html><title>Maps fixture</title><main>Offline navigation test</main>').toString('base64'),
        }).catch(error => {
          // A tab may close while its intercepted navigation is being fulfilled.
          if (!/Session with given id not found|Invalid InterceptionId|No resource with given identifier/.test(error.message)) {
            errors.push({ message: error.message });
          }
        });
      });
      async function evaluate(expression) {
        const result = await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
        if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
        return result.result.value;
      }
      return {
        targetId, command, evaluate, errors,
        async mock() {
          await command('Network.enable');
          await command('Network.setBypassServiceWorker', { bypass: true });
          await command('Fetch.enable', { patterns: [{ urlPattern: 'https://www.google.com/*', requestStage: 'Request' }] });
        },
        async navigate(url) {
          const result = await command('Page.navigate', { url });
          if (result.errorText) throw new Error(result.errorText);
          await until(async () => evaluate('document.readyState === "complete"'));
        },
      };
    }
    return {
      call, page, profile,
      async close({ keepProfile = false } = {}) {
        await call('Browser.close').catch(() => {});
        socket.close();
        if (child.exitCode === null) await new Promise(resolve => child.once('exit', resolve));
        for (const item of pending.values()) clearTimeout(item.timeout);
        if (!keepProfile) rmSync(profile, { recursive: true, force: true });
      },
    };
  } catch (error) {
    socket?.close();
    child.kill();
    throw error;
  }
}

export async function until(check, timeout = 10000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error('Condition not reached before timeout');
}
