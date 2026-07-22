<script lang="ts">
	import type { StellarLinks } from '$lib/types';

	let { links }: { links: StellarLinks } = $props();

	type ShortcutKey = 'chzzk' | 'x' | 'youtube' | 'cafe' | 'instagram';
	let shortcuts = $derived([
		{ key: 'chzzk' as ShortcutKey, href: links.chzzk, label: '치지직' },
		{ key: 'x' as ShortcutKey, href: links.x, label: 'X' },
		{ key: 'youtube' as ShortcutKey, href: links.youtube, label: '유튜브' },
		{ key: 'cafe' as ShortcutKey, href: links.cafe, label: '팬카페' },
		...(links.instagram !== undefined
			? [{ key: 'instagram' as ShortcutKey, href: links.instagram, label: '인스타그램' }]
			: [])
	]);
</script>

<div class="shortcut-row">
	{#each shortcuts as s (s.key)}
		<a
			class="shortcut-btn"
			href={s.href || undefined}
			target="_blank"
			rel="noopener noreferrer"
			aria-label={s.label}
		>
			<img src={`/icons/${s.key}.svg`} alt="" />
		</a>
	{/each}
</div>

<style>
	.shortcut-row {
		margin-top: 14px;
		display: flex;
		justify-content: center;
		gap: 10px;
		opacity: 0;
		animation: fade-up 0.3s ease-out 0.1s both;
	}

	.shortcut-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		overflow: hidden;
		background: var(--color-surface);
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
		transition: transform 0.15s ease;
	}

	.shortcut-btn:active {
		transform: scale(0.92);
	}

	.shortcut-btn img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	@keyframes fade-up {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.shortcut-row {
			animation: none !important;
			opacity: 1;
		}
	}
</style>
