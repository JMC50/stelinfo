<script lang="ts">
	import { onMount } from 'svelte';
	import { PUBLIC_SERVER_URL } from '$env/static/public';
	import type { ChzzkUser, StellarLinks, StellarYoutubeSummary, StreamerInfo } from '$lib/types';
	import StellarShortcutRow from '$lib/components/StellarShortcutRow.svelte';
	import StellarVideoRow from '$lib/components/StellarVideoRow.svelte';

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
	// info.follow_date arrives as "YYYY-MM-DD HH:mm:ss" — only the date part
	// reads naturally in "...부터" ("since ...").
	let followDateOnly = $derived(info.follow_date ? info.follow_date.split(' ')[0] : '');

	// info.follow_date now comes straight from Chzzk's own API as
	// "YYYY-MM-DD HH:mm:ss" (a space, not a "T"), which `new Date(...)`
	// can't parse — swap it for a proper ISO-ish separator instead of
	// assuming a date-only string.
	function daysSince(dateStr: string): number {
		const start = new Date(dateStr.replace(' ', 'T'));
		const diffMs = Date.now() - start.getTime();
		return Math.floor(diffMs / 86_400_000) + 1;
	}

	let youtube = $state<StellarYoutubeSummary | null>(null);

	onMount(async () => {
		const res = await fetch(`${PUBLIC_SERVER_URL}/youtube/${stellarId}`);
		if (res.ok) youtube = await res.json();
	});
</script>

<section class="detail" style={`--stellar-color:${info.HEX}; --stellar-text:${info.text_HEX}`}>
	<div class="detail-inner">
		<button class="back-btn" onclick={onBack} aria-label="스텔라 목록으로 돌아가기">
			<span aria-hidden="true">←</span> 목록으로
		</button>

		<div class="detail-grid">
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

			<div class="area-shortcuts"><StellarShortcutRow {links} /></div>

			<div class="status-row">
				<div class="status-pill" class:active={isFollowing}>
					<span class="pill-label">팔로우</span>
					<span class="pill-value">{isFollowing ? '팔로잉' : '미팔로우'}</span>
					<span class="pill-sub"
						>{isFollowing ? `${followDays}일째 · ${followDateOnly}부터` : ' '}</span
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

			<div class="area-videos"><StellarVideoRow {youtube} /></div>
		</div>
	</div>
</section>

<style>
	.detail {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.detail-inner {
		flex: 1;
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	/* Mobile: transparent, children just stack in .detail-inner's flex
	   column in document order — same visual result as before this was
	   introduced for the desktop grid below. */
	.detail-grid {
		display: contents;
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
		.status-row,
		.info-card {
			animation: none !important;
			opacity: 1;
			transform: none;
		}
	}

	.hero-avatar-wrap {
		width: 108px;
		height: 108px;
		margin: 0 auto;
		border-radius: 50%;
		padding: 4px;
	}

	.hero-avatar {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
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

	.chzzk-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.info-card-icon {
		width: 15px;
	}

	/* PC/tablet: same two-layer break-out as the select screen (full-bleed
	   outer, capped-and-centered inner), then hero becomes a tall portrait
	   card anchoring one side with everything else arranged around it in a
	   bento grid instead of one long stack. */
	@media (min-width: 768px) {
		.detail {
			width: 100vw;
			margin-left: calc(50% - 50vw);
		}

		.detail-inner {
			max-width: 1080px;
			margin: 0 auto;
			padding: 0 40px;
		}

		.detail-grid {
			display: grid;
			grid-template-columns: 340px 1fr 1fr;
			grid-template-rows: auto auto auto auto;
			grid-template-areas:
				'hero shortcuts shortcuts'
				'hero status status'
				'hero user stream'
				'hero videos videos';
			gap: 20px;
			margin-top: 28px;
			/* No explicit align-items — grid's default "stretch" is what we
			   want here: info-card--user and info-card--stream share a row
			   with uneven content (one line vs. title+date), and stretching
			   them to match heights reads much better side by side than
			   letting the shorter one hug its own content height. */
		}

		.hero {
			grid-area: hero;
			margin-top: 0;
			height: 100%;
			display: flex;
			flex-direction: column;
			justify-content: center;
			padding: 40px 28px;
		}

		.hero-avatar-wrap {
			width: 140px;
			height: 140px;
		}

		.hero h1 {
			margin-top: 14px;
			font-size: 26px;
		}

		.area-shortcuts {
			grid-area: shortcuts;
		}

		.area-shortcuts :global(.shortcut-row) {
			margin-top: 0;
			justify-content: flex-start;
		}

		.status-row {
			grid-area: status;
			margin-top: 0;
		}

		.info-card--user {
			grid-area: user;
			margin-top: 0;
			display: flex;
			flex-direction: column;
		}

		.info-card--stream {
			grid-area: stream;
			margin-top: 0;
			display: flex;
			flex-direction: column;
			justify-content: center;
		}

		.area-videos {
			grid-area: videos;
		}

		.area-videos :global(.video-row) {
			margin-top: 0;
		}
	}
</style>
