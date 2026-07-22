import adapter from '@sveltejs/adapter-vercel'; // adapter-auto에서 adapter-vercel로 변경
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
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
			registerType: 'autoUpdate',
			includeAssets: ['icons/icon.png'],
			manifest: {
				name: 'StelInfo',
				short_name: 'StelInfo',
				description: '스텔라이브 팔로우・정보 확인 서비스',
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