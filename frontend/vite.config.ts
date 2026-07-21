import adapter from '@sveltejs/adapter-vercel'; // adapter-auto에서 adapter-vercel로 변경
import { sveltekit } from '@sveltejs/kit/vite';
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
			adapter: adapter()
		})
	]
});