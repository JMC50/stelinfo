<script lang="ts">
	import type { StellarYoutubeSummary } from '$lib/types';

	let { youtube }: { youtube: StellarYoutubeSummary | null } = $props();

	// Two-step reveal for the video cards: first tap blurs the thumbnail and
	// shows the title, second tap (on the same card) opens the video.
	// Tapping anywhere outside both cards resets whichever one was active.
	type VideoCardKey = 'video' | 'music';
	let activeCard = $state<VideoCardKey | null>(null);
	let videoRowEl: HTMLElement | undefined = $state();

	function handleVideoCardClick(key: VideoCardKey, url: string | undefined) {
		if (!url) return;
		if (activeCard === key) {
			window.open(url, '_blank', 'noopener,noreferrer');
			activeCard = null;
		} else {
			activeCard = key;
		}
	}

	function handleWindowClick(e: MouseEvent) {
		if (activeCard && videoRowEl && !videoRowEl.contains(e.target as Node)) {
			activeCard = null;
		}
	}
</script>

<svelte:window onclick={handleWindowClick} />

<div class="video-row" bind:this={videoRowEl}>
	<button
		class="video-card"
		class:is-active={activeCard === 'video'}
		onclick={() => handleVideoCardClick('video', youtube?.latestVideo?.url)}
		disabled={!youtube?.latestVideo}
		aria-label="최신 영상"
	>
		{#if youtube?.latestVideo}
			<img src={youtube.latestVideo.thumbnail ?? ''} alt="" />
			<span class="video-card-play" aria-hidden="true"></span>
			<div class="video-card-overlay">
				<span class="video-card-label">최신 영상</span>
				<span class="video-card-title">{youtube.latestVideo.title}</span>
			</div>
		{/if}
	</button>
	<button
		class="video-card"
		class:is-active={activeCard === 'music'}
		onclick={() => handleVideoCardClick('music', youtube?.latestMusicVideo?.url)}
		disabled={!youtube?.latestMusicVideo}
		aria-label="최신 음악 영상"
	>
		{#if youtube?.latestMusicVideo}
			<img src={youtube.latestMusicVideo.thumbnail ?? ''} alt="" />
			<span class="video-card-play" aria-hidden="true"></span>
			<div class="video-card-overlay">
				<span class="video-card-label">최신 음악 영상</span>
				<span class="video-card-title">{youtube.latestMusicVideo.title}</span>
			</div>
		{/if}
	</button>
</div>

<style>
	.video-row {
		margin-top: 14px;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		opacity: 0;
		animation: fade-up 0.3s ease-out 0.4s both;
	}

	.video-card {
		position: relative;
		aspect-ratio: 16 / 9;
		border: none;
		padding: 0;
		border-radius: var(--radius-md);
		overflow: hidden;
		background: var(--color-bg-soft);
		box-shadow: 0 4px 12px rgba(134, 127, 219, 0.12);
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		-webkit-touch-callout: none;
	}

	.video-card:disabled {
		cursor: default;
	}

	.video-card img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: blur(0) brightness(1);
		transition:
			filter 0.25s ease,
			transform 0.25s ease;
	}

	.video-card.is-active img {
		filter: blur(4px) brightness(0.55);
		transform: scale(1.05);
	}

	.video-card-play {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.45);
		transform: translate(-50%, -50%);
		transition: opacity 0.2s ease;
	}

	.video-card-play::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 55%;
		width: 0;
		height: 0;
		border-style: solid;
		border-width: 6px 0 6px 10px;
		border-color: transparent transparent transparent #ffffff;
		transform: translate(-50%, -50%);
	}

	.video-card.is-active .video-card-play {
		opacity: 0;
	}

	.video-card-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 10px;
		text-align: center;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.25s ease;
	}

	.video-card.is-active .video-card-overlay {
		opacity: 1;
	}

	.video-card-label {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.03em;
		color: rgba(255, 255, 255, 0.75);
	}

	.video-card-title {
		font-size: 12px;
		font-weight: 700;
		color: #ffffff;
		line-height: 1.35;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
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
		.video-row {
			animation: none !important;
			opacity: 1;
		}
	}
</style>
