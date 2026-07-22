// Diagnostic script v2 — run on the Ubuntu server with: node debug-chzzk.js
const { chromium } = require('playwright');

const CHANNEL_ID = 'a6c4ddb09cdb160478996007bff35296'; // Arahashi_tabi

(async () => {
	console.log('--- launching browser ---');
	const browser = await chromium.launch({
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox']
	});
	console.log('--- browser version:', await browser.version());

	const context = await browser.newContext({
		userAgent:
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
		viewport: { width: 1280, height: 720 },
		locale: 'ko-KR',
		timezoneId: 'Asia/Seoul'
	});

	const page = await context.newPage();

	page.on('console', (msg) => console.log('[page console]', msg.type(), msg.text()));
	page.on('pageerror', (err) => console.log('[page error]', err.message));
	page.on('crash', () => console.log('[PAGE CRASHED]'));
	page.on('requestfailed', (req) =>
		console.log('[request failed]', req.url(), req.failure()?.errorText)
	);
	page.on('request', (req) => console.log('[request]', req.method(), req.url()));
	page.on('response', (res) => console.log('[response]', res.status(), res.url()));

	console.log('--- navigating (waitUntil: load, timeout 60s) ---');
	try {
		await page.goto(`https://chzzk.naver.com/live/${CHANNEL_ID}`, {
			waitUntil: 'load',
			timeout: 60000
		});
		console.log('--- "load" event fired ---');
	} catch (err) {
		console.log('--- navigation error:', err.message);
	}

	console.log('--- waiting 8s extra for any late JS/XHR activity ---');
	await page.waitForTimeout(8000);

	const readyState = await page.evaluate(() => document.readyState).catch((e) => `EVAL FAILED: ${e.message}`);
	const scriptCount = await page
		.evaluate(() => document.querySelectorAll('script').length)
		.catch((e) => `EVAL FAILED: ${e.message}`);
	const title = await page.title().catch((e) => `TITLE FAILED: ${e.message}`);
	const bodyLength = await page
		.evaluate(() => document.body?.innerText?.length ?? 0)
		.catch((e) => `EVAL FAILED: ${e.message}`);
	const url = page.url();

	console.log('--- final url:', url);
	console.log('--- document.readyState:', readyState);
	console.log('--- <script> tag count:', scriptCount);
	console.log('--- page title:', title);
	console.log('--- body text length:', bodyLength);

	await page.screenshot({ path: 'debug-screenshot.png', fullPage: true }).catch((e) => {
		console.log('--- screenshot failed:', e.message);
	});
	console.log('--- screenshot saved ---');

	await browser.close();
	console.log('--- done ---');
})().catch((err) => {
	console.error('--- FATAL ERROR ---', err);
});
