<script lang="ts">
	import { onMount } from 'svelte';

	// Tablet-sized viewport (roughly iPad mini through iPad Pro / Android
	// tablets) held in portrait: the PC/tablet layouts (login split, select
	// and detail bento grids) all key off a 768px width breakpoint, which a
	// tablet only clears once rotated to landscape — so nudge the user
	// toward the orientation the layout was actually designed for.
	const QUERY = '(min-width: 600px) and (max-width: 1024px) and (orientation: portrait)';

	let show = $state(false);
	let dismissed = false;

	function evaluate(mql: MediaQueryList) {
		if (mql.matches) {
			if (!dismissed) show = true;
		} else {
			// Leaving portrait clears the dismissal too, so the hint can
			// resurface if the device is rotated back to portrait later.
			show = false;
			dismissed = false;
		}
	}

	function dismiss() {
		show = false;
		dismissed = true;
	}

	onMount(() => {
		const mql = window.matchMedia(QUERY);
		evaluate(mql);
		const onChange = () => evaluate(mql);
		mql.addEventListener('change', onChange);
		return () => mql.removeEventListener('change', onChange);
	});
</script>

{#if show}
	<div class="rotate-hint" role="status">
		<span class="rotate-icon" aria-hidden="true">⟳</span>
		<p>태블릿에서는 화면을 가로로 돌리면 더 편하게 볼 수 있어요.</p>
		<button class="rotate-dismiss" onclick={dismiss} aria-label="닫기">✕</button>
	</div>
{/if}

<style>
	.rotate-hint {
		position: fixed;
		top: calc(var(--safe-top, 0px) + 12px);
		left: 50%;
		transform: translateX(-50%);
		z-index: 100;
		display: flex;
		align-items: center;
		gap: 10px;
		max-width: min(92vw, 420px);
		background: #15181b;
		color: #ffffff;
		border-radius: 999px;
		padding: 10px 12px 10px 16px;
		box-shadow: 0 10px 26px rgba(0, 0, 0, 0.25);
		animation: rotate-hint-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	.rotate-icon {
		font-size: 16px;
		flex: none;
	}

	.rotate-hint p {
		margin: 0;
		font-size: 13px;
		line-height: 1.4;
	}

	.rotate-dismiss {
		flex: none;
		border: none;
		background: rgba(255, 255, 255, 0.14);
		color: inherit;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		font-size: 11px;
		line-height: 1;
		cursor: pointer;
	}

	@keyframes rotate-hint-in {
		from {
			opacity: 0;
			transform: translate(-50%, -10px);
		}
		to {
			opacity: 1;
			transform: translate(-50%, 0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.rotate-hint {
			animation: none;
		}
	}
</style>
