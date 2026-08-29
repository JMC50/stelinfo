import adapter from '@sveltejs/adapter-vercel'; // adapter-auto에서 adapter-vercel로 변경
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	// workbox-precaching (used by src/service-worker.ts) reads
	// process.env.NODE_ENV, which isn't defined in the service worker's own
	// build context otherwise.
	define: {
		'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production')
	},
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Vercel 전용 어댑터 사용
			adapter: adapter(),

			// vite-plugin-pwa registers its own service worker.
			serviceWorker: { register: false }
		}),
		SvelteKitPWA({
			// Custom service worker (src/service-worker.ts) instead of the
			// auto-generated one, so it can add push/notificationclick
			// handlers -- generateSW has no hook for custom event listeners.
			strategies: 'injectManifest',
			srcDir: 'src',
			filename: 'service-worker.ts',
			injectManifest: {
				globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,webmanifest}']
			},
			// The service worker is normally build-only; this turns it on for
			// `vite dev` too so push notifications (which need a real SW
			// registration) can be tested locally without a full production
			// build -- handy since the Vercel adapter step currently can't
			// finish on Windows (unrelated symlink/EPERM issue).
			devOptions: {
				enabled: true,
				type: 'module'
			},
			registerType: 'autoUpdate',
			includeAssets: ['icons/icon.png'],
			manifest: {
				name: 'StelInfo',
				short_name: 'StelInfo',
				description: '스텔라이브 팔로우・구독 정보 확인 서비스',
				start_url: '/',
				display: 'standalone',
				background_color: '#dae0fc',
				theme_color: '#867fdb',
				lang: 'ko',
				icons: [
					{
						src: '/icons/icon.png',
						sizes: '766x766',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: '/icons/icon.png',
						sizes: '766x766',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			}
		})
	]
});