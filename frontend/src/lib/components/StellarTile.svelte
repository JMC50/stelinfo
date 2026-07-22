<script lang="ts">
	import type { StellarProfile } from '$lib/types';

	let {
		stellar,
		loading,
		disabled,
		delayMs,
		onSelect
	}: {
		stellar: StellarProfile;
		loading: boolean;
		disabled: boolean;
		delayMs: number;
		onSelect: () => void;
	} = $props();
</script>

<button
	class="stellar-tile"
	style={`--tile-color:${stellar.color}; --delay:${delayMs}ms`}
	onclick={onSelect}
	{disabled}
>
	<span class="tile-avatar" class:is-loading={loading}>
		<img src={stellar.image} alt={stellar.engName} loading="lazy" />
	</span>
	<span class="tile-name">{stellar.shortName}</span>
</button>

<style>
	.stellar-tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		background: none;
		border: none;
		padding: 4px;
		cursor: pointer;
		opacity: 0;
		animation: fade-up 0.32s ease-out both;
		animation-delay: calc(150ms + var(--delay, 0ms));
		-webkit-tap-highlight-color: transparent;
		-webkit-touch-callout: none;
	}

	.stellar-tile:disabled {
		cursor: default;
		opacity: 0.55;
	}

	.tile-avatar {
		position: relative;
		width: 100%;
		aspect-ratio: 1;
		border-radius: 50%;
		padding: 3px;
		background: linear-gradient(160deg, var(--tile-color), var(--color-bg-soft));
		box-shadow: 0 6px 16px rgba(134, 127, 219, 0.16);
	}

	/* Personal-color sparkle burst, shown together with the loading spinner
	   once a tap actually selects this stellar — standing in for the default
	   mobile tap highlight (disabled above via -webkit-tap-highlight-color).
	   Uses ::before so it doesn't collide with the ::after loading spinner. */
	.tile-avatar::before {
		content: '';
		position: absolute;
		inset: -35%;
		z-index: -1;
		border-radius: 50%;
		background: radial-gradient(circle, var(--tile-color) 0%, transparent 70%);
		opacity: 0;
		transform: scale(0.5);
		pointer-events: none;
	}

	.tile-avatar.is-loading::before {
		animation: tile-sparkle 0.9s ease-out infinite;
	}

	@keyframes tile-sparkle {
		0% {
			opacity: 0.75;
			transform: scale(0.5);
		}
		100% {
			opacity: 0;
			transform: scale(1.4);
		}
	}

	.tile-avatar img {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid var(--color-surface);
	}

	.tile-avatar.is-loading::after {
		content: '';
		position: absolute;
		inset: -3px;
		border-radius: 50%;
		border: 2px solid transparent;
		border-top-color: var(--color-primary);
		animation: spin 0.7s linear infinite;
	}

	.tile-name {
		font-size: 12px;
		font-weight: 600;
		color: var(--color-text);
	}

	@keyframes fade-up {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.stellar-tile {
			animation: none;
			opacity: 1;
		}
	}
</style>
