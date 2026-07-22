// Diagnostic script — run this directly on the Ubuntu server with:
//   node debug-chzzk.js
// Then share the full console output (and check for debug-screenshot.png).
const { chromium } = require('playwright');

const CHANNEL_ID = 'a6c4ddb09cdb160478996007bff35296'; // Arahashi_tabi

(async () => {
	console.log('--- launching browser ---');
	const browser = await chromium.launch({
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox']
	});
	console.log('--- browser launched ---');

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
	page.on('requestfailed', (req) =>
		console.log('[request failed]', req.url(), req.failure()?.errorText)
	);
	page.on('response', (res) => {
		const url = res.url();
		if (url.includes('chzzk')) {
			console.log('[response]', res.status(), url);
		}
	});

	const webdriverFlag = await page.evaluate(() => navigator.webdriver);
	console.log('--- navigator.webdriver before nav:', webdriverFlag);

	console.log('--- navigating ---');
	try {
		await page.goto(`https://chzzk.naver.com/live/${CHANNEL_ID}`, {
			waitUntil: 'networkidle',
			timeout: 20000
		});
		console.log('--- navigation finished ---');
	} catch (err) {
		console.log('--- navigation error:', err.message);
	}

	await page.waitForTimeout(2000);

	const title = await page.title();
	const bodyLength = await page.evaluate(() => document.body?.innerText?.length ?? 0);
	console.log('--- page title:', title);
	console.log('--- body text length:', bodyLength);

	await page.screenshot({ path: 'debug-screenshot.png' }).catch((e) => {
		console.log('--- screenshot failed:', e.message);
	});
	console.log('--- screenshot saved to debug-screenshot.png (if no error above) ---');

	await browser.close();
	console.log('--- done ---');
})().catch((err) => {
	console.error('--- FATAL ERROR ---', err);
});
