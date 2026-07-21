<script lang="ts">
	import type { StreamerInfo } from '$lib/types';

	let { info, image, onBack }: { info: StreamerInfo; image: string; onBack: () => void } = $props();

	let isFollowing = $derived(!!info.follow_date);
	let isSubscribed = $derived(info.subscribe_month > 0);
	let followDays = $derived(info.follow_date ? daysSince(info.follow_date) : null);

	function daysSince(dateStr: string): number {
		const start = new Date(`${dateStr}T00:00:00`);
		const diffMs = Date.now() - start.getTime();
		return Math.floor(diffMs / 86_400_000) + 1;
	}
</script>

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
				<dt>채널명</dt>
				<dd>{info.channelname}</dd>
			</div>
		</dl>
	</div>

	<div class="info-card info-card--stream">
		<h2>최근 방송</h2>
		<p class="stream-title">{info.last_stream_title}</p>
		<p class="stream-date">{info.last_stream_date}</p>
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
	}

	.info-card h2 {
		font-size: 13px;
		font-weight: 700;
		color: var(--color-text-muted);
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
</style>
