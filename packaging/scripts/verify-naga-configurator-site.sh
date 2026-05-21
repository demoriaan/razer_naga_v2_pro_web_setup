#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

tmpdir="$(mktemp -d)"
port="$(
  python3 - <<'PY'
import socket

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
    sock.bind(("127.0.0.1", 0))
    print(sock.getsockname()[1])
PY
)"
server_pid=""
cleanup() {
  if [[ -n "$server_pid" ]]; then
    kill "$server_pid" 2>/dev/null || true
    wait "$server_pid" 2>/dev/null || true
  fi
  rm -rf "$tmpdir"
}
trap cleanup EXIT

node --check apps/naga-configurator/naga-webhid.js
python3 -m http.server "$port" --bind 127.0.0.1 --directory apps/naga-configurator \
  >"$tmpdir/server.out" 2>"$tmpdir/server.err" &
server_pid=$!

for _ in $(seq 1 40); do
  if curl -fsS "http://127.0.0.1:$port/" >/dev/null 2>&1; then
    break
  fi
  sleep 0.1
done
curl -fsS "http://127.0.0.1:$port/" >/dev/null
curl -fsS "http://127.0.0.1:$port/naga-webhid.js" | grep -q 'buildKeyboardReport'
index_html="$(curl -fsS "http://127.0.0.1:$port/")"
grep -q 'Content-Security-Policy' <<<"$index_html"
grep -q 'site.webmanifest' <<<"$index_html"
grep -q 'favicon.svg' <<<"$index_html"
grep -q 'og:title' <<<"$index_html"
curl -fsS "http://127.0.0.1:$port/site.webmanifest" | grep -q 'Razer Naga V2 Pro Configurator'
curl -fsS "http://127.0.0.1:$port/favicon.svg" | grep -q '<svg'
test -s apps/naga-configurator/fonts/space-grotesk-latin.woff2
test -s apps/naga-configurator/fonts/jetbrains-mono-latin.woff2
if grep -RInE '(^|[[:space:]<])style[[:space:]]*=|(^|[[:space:]<])on[a-z]+[[:space:]]*=' \
  apps/naga-configurator/index.html apps/naga-configurator/naga-webhid.js; then
  echo "Inline style/event handler found; this would weaken the CSP." >&2
  exit 1
fi

cat > "$tmpdir/naga-site.spec.js" <<'JS'
const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM || undefined });
  const baseUrl = process.env.BASE_URL;
  const context = await browser.newContext({ viewport: { width: 1440, height: 980 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const desktopGuards = attachPageGuards(page, 'desktop');
  await page.goto(baseUrl);
  await page.getByRole('heading', { name: 'Razer Naga V2 Pro' }).waitFor({ state: 'visible', timeout: 5000 });
  await assertReleaseMetadata(page);
  await assertAccessibleControls(page);
  await assertVisible(page, 'text=Unofficial on-board side-button configurator');
  await page.locator('#nagaCompatibilityAlert').waitFor({ state: 'hidden', timeout: 5000 });
  await page.locator('#nagaBrowserStatus', { hasText: 'WebHID available' }).waitFor({ state: 'visible', timeout: 5000 });
  await page.getByRole('heading', { name: '6-button side plate' }).waitFor({ state: 'visible', timeout: 5000 });
  await assertVisible(page, 'text=Readback, write, power-cycle persistence, F13-F16 and forward/back buttons validated.');
  await assertVisible(page, 'text=The mouse does not expose a validated side-plate detection report yet.');
  await assertVisible(page, 'text=Side 1');
  assert.strictEqual(await page.locator('#nagaExportBackupButton').isDisabled(), true);
  assert.strictEqual(await page.locator('#nagaRestoreBackupButton').isDisabled(), true);
  await page.locator('[data-naga-button="side1"]').getByText('Not read yet').waitFor({ state: 'visible', timeout: 5000 });
  await page.locator('[data-naga-button="side1"]').getByText('No write; current value is preserved.').waitFor({ state: 'visible', timeout: 5000 });
  await page.click('#nagaPresetButton');
  await page.check('#nagaWriteConsent');
  await page.click('#nagaApplyButton');
  await assertVisible(page, 'text=Write blocked: confirm that the mounted side plate matches the selected layout.');
  await assertVisible(page, 'text=args 01 50 00 02 02 00 68 00 00 00');
  await assertVisible(page, 'text=args 01 51 00 02 02 00 69 00 00 00');
  await assertVisible(page, 'text=args 01 52 00 02 02 00 6a 00 00 00');
  await assertVisible(page, 'text=args 01 53 00 02 02 00 6b 00 00 00');
  await assertVisible(page, 'text=args 01 54 00 01 01 05 00 00 00 00');
  await assertVisible(page, 'text=args 01 55 00 01 01 04 00 00 00 00');
  await page.selectOption('[data-naga-button="side1"] [data-naga-key]', 'disabled');
  await assertVisible(page, 'text=args 01 50 00 00 00 00 00 00 00 00');
  await page.selectOption('[data-naga-button="side2"] [data-naga-key]', 'double:left');
  await assertVisible(page, 'text=args 01 51 00 0b 01 01 00 00 00 00');
  await page.selectOption('[data-naga-button="side3"] [data-naga-key]', 'media:play-pause');
  await assertVisible(page, 'text=args 01 52 00 0a 02 00 cd 00 00 00');
  await page.selectOption('[data-naga-button="side4"] [data-naga-key]', 'dpi:cycle-up');
  await assertVisible(page, 'text=args 01 53 00 06 01 06 00 00 00 00');
  await page.selectOption('[data-naga-button="side4"] [data-naga-key]', 'profile:cycle-up');
  await assertVisible(page, 'text=args 01 53 00 07 01 04 00 00 00 00');
  await page.selectOption('[data-naga-button="side4"] [data-naga-key]', 'scroll:mode-toggle');
  await assertVisible(page, 'text=args 01 53 00 12 01 01 00 00 00 00');
  assert.strictEqual(
    await page.locator('[data-naga-key] option[value*="hypershift"]').count(),
    0,
  );
  await page.selectOption('[data-naga-button="side5"] [data-naga-key]', 'F17');
  await assertVisible(page, 'text=args 01 54 00 02 02 00 6c 00 00 00');
  await page.click('#nagaKeepButton');
  await page.locator('[data-naga-button="side5"]').getByText('No write; current value is preserved.').waitFor({ state: 'visible', timeout: 5000 });
  await page.getByRole('tab', { name: /^2-button side plate/ }).click();
  await page.getByRole('heading', { name: '2-button side plate' }).waitFor({ state: 'visible', timeout: 5000 });
  await assertVisible(page, 'text=Readback and physical press capture validated: front/forward is 0x05, rear/back is 0x04.');
  await page.locator('[data-naga-button="naga2Front"]').getByText('Front / Forward', { exact: true }).waitFor({ state: 'visible', timeout: 5000 });
  await page.locator('[data-naga-button="naga2Rear"]').getByText('Rear / Back', { exact: true }).waitFor({ state: 'visible', timeout: 5000 });
  await page.locator('[data-naga-button="naga2Front"]').getByText('No write; current value is preserved.').waitFor({ state: 'visible', timeout: 5000 });
  await page.click('#nagaPresetButton');
  await assertVisible(page, 'text=args 01 05 00 01 01 05 00 00 00 00');
  await assertVisible(page, 'text=args 01 04 00 01 01 04 00 00 00 00');
  await page.getByRole('tab', { name: /^12-button side plate/ }).click();
  await page.getByRole('heading', { name: '12-button side plate' }).waitFor({ state: 'visible', timeout: 5000 });
  await assertVisible(page, 'text=Readback, writes and physical button order validated. The default preset avoids F20-F22 because those keys can be unreliable in target apps.');
  await page.locator('[data-naga-button="pad1"]').getByText('Pad 1', { exact: true }).waitFor({ state: 'visible', timeout: 5000 });
  await page.locator('[data-naga-button="pad12"]').getByText('Pad 12', { exact: true }).waitFor({ state: 'visible', timeout: 5000 });
  await page.click('#nagaPresetButton');
  await assertVisible(page, 'text=args 01 40 00 02 02 00 68 00 00 00');
  await assertVisible(page, 'text=args 01 47 00 02 02 07 25 00 00 00');
  await assertVisible(page, 'text=args 01 48 00 02 02 07 26 00 00 00');
  await assertVisible(page, 'text=args 01 49 00 02 02 07 27 00 00 00');
  await assertVisible(page, 'text=args 01 4b 00 02 02 00 73 00 00 00');
  await page.click('#nagaClearLogButton');
  await assertVisible(page, 'text=Write selected bindings');
  await assertNoBrowserErrors(desktopGuards);
  await page.screenshot({ path: process.env.REPO_ROOT + '/docs/previews/naga-configurator.png', fullPage: true });

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 900 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  const mobileGuards = attachPageGuards(mobilePage, 'mobile');
  await mobilePage.goto(baseUrl);
  await mobilePage.getByRole('heading', { name: 'Razer Naga V2 Pro' }).waitFor({ state: 'visible', timeout: 5000 });
  await assertAccessibleControls(mobilePage);
  assert.strictEqual(
    await mobilePage.locator('[data-naga-button="side1"] [data-naga-key]').inputValue(),
    'keep',
  );
  assert.strictEqual(await mobilePage.locator('.naga-row').count(), 6);
  assert.strictEqual(
    await mobilePage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
    true,
  );
  await mobilePage.getByRole('tab', { name: /^12-button side plate/ }).click();
  await mobilePage.getByRole('heading', { name: '12-button side plate' }).waitFor({ state: 'visible', timeout: 5000 });
  assert.strictEqual(await mobilePage.locator('.naga-row').count(), 12);
  assert.strictEqual(
    await mobilePage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
    true,
  );
  await assertNoBrowserErrors(mobileGuards);
  await mobilePage.screenshot({ path: process.env.REPO_ROOT + '/docs/previews/naga-configurator-mobile.png', fullPage: true });
  await mobileContext.close();

  const firefoxContext = await browser.newContext({
    viewport: { width: 1280, height: 820 },
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0'
  });
  await firefoxContext.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'hid', {
      configurable: true,
      get() {
        return undefined;
      },
    });
  });
  const firefoxPage = await firefoxContext.newPage();
  const firefoxGuards = attachPageGuards(firefoxPage, 'firefox-no-webhid');
  await firefoxPage.goto(baseUrl);
  await assertVisible(firefoxPage, 'text=This browser cannot configure the mouse');
  await assertVisible(firefoxPage, 'text=Detected Firefox on Linux');
  const chromiumLink = firefoxPage.getByRole('link', { name: 'Chromium (recommended, less Google)' });
  await chromiumLink.waitFor({ state: 'visible', timeout: 5000 });
  assert.strictEqual(await chromiumLink.getAttribute('href'), 'https://www.chromium.org/getting-involved/download-chromium/');
  assert.strictEqual(await firefoxPage.getByRole('link', { name: 'Google Chrome' }).getAttribute('href'), 'https://www.google.com/chrome/');
  assert.strictEqual(await firefoxPage.getByRole('link', { name: 'Microsoft Edge' }).getAttribute('href'), 'https://www.microsoft.com/edge');
  assert.strictEqual(await firefoxPage.locator('#nagaConnectButton').isDisabled(), true);
  assert.strictEqual(await firefoxPage.locator('#nagaReadButton').isDisabled(), true);
  await assertNoBrowserErrors(firefoxGuards);
  await firefoxContext.close();

  for (const viewport of [
    { width: 375, height: 820 },
    { width: 768, height: 900 },
    { width: 1024, height: 900 },
    { width: 1280, height: 940 },
    { width: 1920, height: 1080 },
  ]) {
    const viewportContext = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    const viewportPage = await viewportContext.newPage();
    const guards = attachPageGuards(viewportPage, `${viewport.width}x${viewport.height}`);
    await viewportPage.goto(baseUrl);
    await viewportPage.getByRole('heading', { name: 'Razer Naga V2 Pro' }).waitFor({ state: 'visible', timeout: 5000 });
    assert.strictEqual(
      await viewportPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
      true,
      `horizontal overflow at ${viewport.width}x${viewport.height}`,
    );
    await assertAccessibleControls(viewportPage);
    await assertNoBrowserErrors(guards);
    await viewportContext.close();
  }
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function assertVisible(page, selector) {
  await page.locator(selector).waitFor({ state: 'visible', timeout: 5000 });
}

function attachPageGuards(page, label) {
  const consoleErrors = [];
  const pageErrors = [];
  const requestFailures = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(`[${label}] ${message.text()}`);
  });
  page.on('pageerror', (error) => {
    pageErrors.push(`[${label}] ${error.message}`);
  });
  page.on('requestfailed', (request) => {
    const url = request.url();
    if (url.startsWith('data:') || url.startsWith('blob:')) return;
    requestFailures.push(`[${label}] ${url} ${request.failure()?.errorText || 'request failed'}`);
  });
  return { consoleErrors, pageErrors, requestFailures };
}

async function assertNoBrowserErrors(guards) {
  assert.deepStrictEqual(guards.consoleErrors, []);
  assert.deepStrictEqual(guards.pageErrors, []);
  assert.deepStrictEqual(guards.requestFailures, []);
}

async function assertReleaseMetadata(page) {
  assert.strictEqual(
    await page.locator('meta[http-equiv="Content-Security-Policy"]').count(),
    1,
  );
  assert.strictEqual(
    await page.locator('link[rel="manifest"][href="./site.webmanifest"]').count(),
    1,
  );
  assert.strictEqual(
    await page.locator('link[rel="icon"][href="./favicon.svg"]').count(),
    1,
  );
  assert.strictEqual(
    await page.locator('meta[property="og:title"][content="Razer Naga V2 Pro Configurator"]').count(),
    1,
  );
}

async function assertAccessibleControls(page) {
  const unnamedButtons = await page.$$eval('button', (buttons) =>
    buttons
      .filter((button) => {
        const text = button.textContent || '';
        const label = button.getAttribute('aria-label') || '';
        const title = button.getAttribute('title') || '';
        return !(text.trim() || label.trim() || title.trim());
      })
      .map((button) => button.outerHTML),
  );
  assert.deepStrictEqual(unnamedButtons, []);

  const unlabeledSelects = await page.$$eval('select', (selects) =>
    selects
      .filter((select) => !select.labels?.length && !select.getAttribute('aria-label'))
      .map((select) => select.outerHTML),
  );
  assert.deepStrictEqual(unlabeledSelects, []);

  const tinyTargets = await page.$$eval('button, select, input', (nodes) =>
    nodes
      .filter((node) => {
        if (node.disabled) return false;
        const rect = node.getBoundingClientRect();
        return rect.width < 24 || rect.height < 24;
      })
      .map((node) => `${node.tagName.toLowerCase()} ${node.textContent?.trim() || node.getAttribute('id') || ''}`),
  );
  assert.deepStrictEqual(tinyTargets, []);
}
JS

(cd "$tmpdir" && npm init -y >/dev/null 2>&1 && npm install playwright@1.60.0 >/dev/null 2>&1 && BASE_URL="http://127.0.0.1:$port/" REPO_ROOT="$repo_root" node naga-site.spec.js)
test -s docs/previews/naga-configurator.png

echo "verify-naga-configurator-site: OK"
