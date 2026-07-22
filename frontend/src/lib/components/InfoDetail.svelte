<script lang="ts">
	import { onMount } from 'svelte';
	import { PUBLIC_SERVER_URL } from '$env/static/public';
	import type { ChzzkUser, StellarLinks, StellarYoutubeSummary, StreamerInfo } from '$lib/types';

	let {
		info,
		image,
		links,
		stellarId,
		user,
		onBack
	}: {
		info: StreamerInfo;
		image: string;
		links: StellarLinks;
		stellarId: string;
		user: ChzzkUser;
		onBack: () => void;
	} = $props();

	let isFollowing = $derived(!!info.follow_date);
	let isSubscribed = $derived(info.subscribe_month > 0);
	let followDays = $derived(info.follow_date ? daysSince(info.follow_date) : null);

	function daysSince(dateStr: string): number {
		const start = new Date(`${dateStr}T00:00:00`);
		const diffMs = Date.now() - start.getTime();
		return Math.floor(diffMs / 86_400_000) + 1;
	}

	type ShortcutKey = 'chzzk' | 'x' | 'youtube' | 'cafe' | 'instagram';
	let shortcuts = $derived(
		[
			{ key: 'chzzk' as ShortcutKey, href: links.chzzk, label: '치지직' },
			{ key: 'x' as ShortcutKey, href: links.x, label: 'X' },
			{ key: 'youtube' as ShortcutKey, href: links.youtube, label: '유튜브' },
			{ key: 'cafe' as ShortcutKey, href: links.cafe, label: '팬카페' },
			...(links.instagram !== undefined
				? [{ key: 'instagram' as ShortcutKey, href: links.instagram, label: '인스타그램' }]
				: [])
		]
	);

	let youtube = $state<StellarYoutubeSummary | null>(null);

	onMount(async () => {
		const res = await fetch(`${PUBLIC_SERVER_URL}/youtube/${stellarId}`);
		if (res.ok) youtube = await res.json();
	});

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

<section class="detail" style={`--stellar-color:${info.HEX}; --stellar-text:${info.text_HEX}`}>
	<button class="back-btn" onclick={onBack} aria-label="스텔라 목록으로 돌아가기">
		<span aria-hidden="true">←</span> 목록으로
	</button>

	<div class="hero">
		<div class="hero-avatar-wrap">
			<img class="hero-avatar" src={image} alt={info.stellar} />
		</div>
		<div class="hero-badges" aria-hidden="true">
			<span>{info.oshimark}</span>
			<span>{info.oshimark1}</span>
		</div>
		<h1>{info.memberName}</h1>
		<p class="hero-eng">{info.stellar}</p>
	</div>

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

	<div class="status-row">
		<div class="status-pill" class:active={isFollowing}>
			<span class="pill-label">팔로우</span>
			<span class="pill-value">{isFollowing ? '팔로잉' : '미팔로우'}</span>
			<span class="pill-sub"
				>{isFollowing ? `${followDays}일째 · ${info.follow_date}부터` : ' '}</span
			>
		</div>
		<div class="status-pill" class:active={isSubscribed}>
			<span class="pill-label">구독</span>
			<span class="pill-value">{isSubscribed ? `${info.subscribe_month}개월째` : '미구독'}</span>
			<span class="pill-sub">&nbsp;</span>
		</div>
	</div>

	<div class="info-card info-card--user">
		<h2>유저 정보</h2>
		<dl>
			<div class="info-row">
				<dt>닉네임</dt>
				<dd>{user.channelName}</dd>
			</div>
		</dl>
	</div>

	<a
		class="info-card info-card--stream"
		href={info.last_stream_url || undefined}
		target="_blank"
		rel="noopener noreferrer"
	>
		<div class="chzzk-row">
			<h2>
				{info.is_live ? '방송 중' : '최근 방송'}
				{#if info.is_live}<span class="live-badge">LIVE</span>{/if}
			</h2>
			<img src="/icons/link.svg" alt="" class="info-card-icon" />
		</div>
		<p class="stream-title">{info.last_stream_title}</p>
		<p class="stream-date">{info.last_stream_date}</p>
	</a>

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
</section>

<style>
	.detail {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.back-btn {
		align-self: flex-start;
		display: inline-flex;
		align-items: center;
		gap: 4px;
		background: var(--color-surface);
		border: none;
		border-radius: 999px;
		padding: 8px 14px;
		font-size: 13px;
		font-weight: 600;
		color: var(--color-text);
		box-shadow: 0 4px 12px rgba(134, 127, 219, 0.14);
		cursor: pointer;
	}

	.hero {
		margin-top: 18px;
		border-radius: var(--radius-lg);
		padding: 30px 20px 24px;
		text-align: center;
		background: linear-gradient(
			165deg,
			var(--stellar-color) 0%,
			color-mix(in srgb, var(--stellar-color) 55%, #ffffff) 100%
		);
		color: var(--stellar-text);
		box-shadow: var(--shadow-soft);
		animation: hero-pop 0.38s cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	@keyframes hero-pop {
		0% {
			opacity: 0;
			transform: scale(0.92);
		}
		55% {
			opacity: 1;
			transform: scale(1.035);
		}
		100% {
			transform: scale(1);
		}
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
		.hero,
		.shortcut-row,
		.status-row,
		.info-card {
			animation: none !important;
			opacity: 1;
			transform: none;
		}
	}

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

	.hero-avatar-wrap {
		width: 108px;
		height: 108px;
		margin: 0 auto;
		border-radius: 50%;
		padding: 4px;
		/* background: color-mix(in srgb, var(--stellar-text) 30%, transparent); */
	}

	.hero-avatar {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
		/* border: 3px solid var(--stellar-text); */
	}

	.hero-badges {
		margin-top: 10px;
		font-size: 20px;
		display: flex;
		gap: 8px;
		justify-content: center;
	}

	.hero h1 {
		margin-top: 8px;
		font-size: 21px;
		font-weight: 800;
	}

	.hero-eng {
		margin-top: 2px;
		font-size: 12px;
		opacity: 0.85;
		letter-spacing: 0.02em;
	}

	.status-row {
		margin-top: 16px;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		opacity: 0;
		animation: fade-up 0.3s ease-out 0.16s both;
	}

	.status-pill {
		background: var(--color-surface);
		border-radius: var(--radius-md);
		padding: 14px;
		text-align: center;
		box-shadow: 0 4px 12px rgba(134, 127, 219, 0.12);
		opacity: 0.55;
	}

	.status-pill.active {
		opacity: 1;
		box-shadow: 0 6px 16px rgba(134, 127, 219, 0.22);
	}

	.pill-label {
		display: block;
		font-size: 11px;
		color: var(--color-text-muted);
		font-weight: 600;
	}

	.pill-value {
		display: block;
		margin-top: 4px;
		font-size: 16px;
		font-weight: 800;
		color: var(--color-primary);
	}

	.status-pill:not(.active) .pill-value {
		color: var(--color-text-muted);
	}

	.pill-sub {
		display: block;
		margin-top: 3px;
		font-size: 10px;
		color: var(--color-text-muted);
	}

	.info-card {
		margin-top: 14px;
		background: var(--color-surface);
		border-radius: var(--radius-md);
		padding: 16px 18px;
		box-shadow: 0 4px 12px rgba(134, 127, 219, 0.12);
		opacity: 0;
		animation: fade-up 0.3s ease-out both;
	}

	.info-card--user {
		animation-delay: 0.24s;
	}

	.info-card--stream {
		animation-delay: 0.32s;
		display: block;
		text-decoration: none;
		color: inherit;
		transition: transform 0.15s ease;
		-webkit-tap-highlight-color: transparent;
		-webkit-touch-callout: none;
	}

	.info-card--stream:active {
		transform: scale(0.98);
	}

	.info-card h2 {
		font-size: 13px;
		font-weight: 700;
		color: var(--color-text-muted);
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.live-badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 10px;
		font-weight: 800;
		color: #ffffff;
		background: #ff3b3b;
		padding: 2px 6px;
		border-radius: 999px;
		letter-spacing: 0.02em;
	}

	.live-badge::before {
		content: '';
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: #ffffff;
		animation: live-pulse 1.4s ease-in-out infinite;
	}

	@keyframes live-pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.3;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.live-badge::before {
			animation: none;
		}
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-top: 10px;
		font-size: 14px;
	}

	.info-row dt {
		color: var(--color-text-muted);
	}

	.info-row dd {
		font-weight: 600;
	}

	.stream-title {
		margin-top: 10px;
		font-size: 15px;
		font-weight: 700;
		line-height: 1.4;
	}

	.stream-date {
		margin-top: 6px;
		font-size: 12px;
		color: var(--color-text-muted);
	}

	.chzzk-row{
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.info-card-icon {
		width: 15px;
	}

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

	@media (prefers-reduced-motion: reduce) {
		.video-row {
			animation: none !important;
			opacity: 1;
		}
	}
</style>
