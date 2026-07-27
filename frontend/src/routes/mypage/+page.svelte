<script lang="ts">
	import { goto } from '$app/navigation';
	import { stellars } from '$lib/data/stellars';
	import { auth } from '$lib/state/auth.svelte';
	import { listMyShares, revokeShare } from '$lib/state/shareApi';
	import type { ShareRecord } from '$lib/types';

	let shares = $state<ShareRecord[]>([]);
	let loading = $state(true);
	let revokingId = $state<string | null>(null);

	$effect(() => {
		if (auth.checked && !auth.user) goto('/');
	});

	$effect(() => {
		if (!auth.user) return;
		listMyShares()
			.then((data) => (shares = data))
			.finally(() => (loading = false));
	});

	async function handleRevoke(id: string) {
		if (
			!confirm(
				'삭제하면 다른 사람이 이 인증ID로 더 이상 조회할 수 없어요. 필요하면 나중에 다시 만들 수 있어요. 삭제할까요?'
			)
		)
			return;

		revokingId = id;
		const ok = await revokeShare(id);
		if (ok) shares = shares.filter((s) => s.id !== id);
		revokingId = null;
	}

	function stellarOf(stellarId: string) {
		return stellars.find((s) => s.id === stellarId);
	}

	function followSummary(share: ShareRecord): string {
		const parts: string[] = [];
		if (share.followDate) parts.push('팔로우 중');
		if (share.subscribeMonth > 0) parts.push(`구독 ${share.subscribeMonth}개월`);
		return parts.length > 0 ? parts.join(' · ') : '팔로우/구독 정보 없음';
	}
</script>

<section class="mypage">
	<div class="mypage-inner">
		<header class="page-header">
			<button class="back-btn" onclick={() => goto('/select')} aria-label="목록으로 돌아가기">
				<span aria-hidden="true">←</span> 목록으로
			</button>
			<h1>마이페이지</h1>
			<p class="page-desc">발급한 공유 인증 카드를 확인하고 취소할 수 있어요.</p>
		</header>

		{#if loading}
			<p class="status-text">불러오는 중...</p>
		{:else if shares.length === 0}
			<div class="empty-state">
				<span class="empty-emoji" aria-hidden="true">🗂️</span>
				<p>아직 발급한 공유 카드가 없어요.</p>
				<button class="empty-cta" onclick={() => goto('/select')}>스텔라 보러가기</button>
			</div>
		{:else}
			<ul class="share-list">
				{#each shares as share, i (share.id)}
					{@const stellar = stellarOf(share.stellarId)}
					<li
						class="share-card"
						style={`--accent:${stellar?.color ?? 'var(--color-primary)'}; animation-delay:${i * 60}ms`}
					>
						{#if stellar}
							<img class="share-avatar" src={stellar.image} alt="" />
						{/if}
						<div class="share-card-main">
							<p class="share-member">{share.memberName}</p>
							<p class="share-summary">{followSummary(share)}</p>
							<p class="share-handle">X ID @{share.claimedHandle}</p>
							<p class="share-id">인증ID <span class="id-chip">{share.id}</span></p>
						</div>
						<button
							class="revoke-btn"
							disabled={revokingId === share.id}
							onclick={() => handleRevoke(share.id)}
						>
							{revokingId === share.id ? '취소 중...' : '취소'}
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>

<style>
	.mypage {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.mypage-inner {
		flex: 1;
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	.page-header {
		position: relative;
		opacity: 0;
		animation: fade-up 0.3s ease-out both;
	}

	.back-btn {
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

	.page-header h1 {
		margin-top: 18px;
		font-size: 20px;
		font-weight: 800;
	}

	.page-desc {
		margin-top: 6px;
		font-size: 13px;
		color: var(--color-text-muted);
	}

	.status-text {
		margin-top: 40px;
		text-align: center;
		color: var(--color-text-muted);
		font-size: 14px;
	}

	.empty-state {
		margin-top: 48px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		text-align: center;
		color: var(--color-text-muted);
		font-size: 14px;
		opacity: 0;
		animation: fade-up 0.32s ease-out 0.08s both;
	}

	.empty-emoji {
		font-size: 36px;
	}

	.empty-cta {
		margin-top: 8px;
		border: none;
		background: var(--color-primary);
		color: #fff;
		font-size: 13px;
		font-weight: 700;
		padding: 10px 18px;
		border-radius: 999px;
		cursor: pointer;
	}

	.share-list {
		margin-top: 20px;
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.share-card {
		position: relative;
		background: var(--color-surface);
		border-radius: var(--radius-md);
		padding: 14px 16px 14px 18px;
		box-shadow: 0 4px 12px rgba(134, 127, 219, 0.12);
		display: flex;
		align-items: center;
		gap: 12px;
		opacity: 0;
		animation: fade-up 0.3s ease-out both;
		border-left: 4px solid var(--accent);
	}

	.share-avatar {
		width: 42px;
		height: 42px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
	}

	.share-card-main {
		flex: 1;
		min-width: 0;
	}

	.share-member {
		font-size: 15px;
		font-weight: 700;
	}

	.share-summary {
		margin-top: 4px;
		font-size: 13px;
		color: var(--color-primary);
		font-weight: 600;
	}

	.share-handle {
		margin-top: 4px;
		font-size: 11px;
		color: var(--color-text-muted);
	}

	.share-id {
		margin-top: 5px;
		font-size: 11px;
		color: var(--color-text-muted);
	}

	.id-chip {
		display: inline-block;
		font-family: monospace;
		background: var(--color-bg-soft);
		padding: 2px 6px;
		border-radius: 6px;
		color: var(--color-text);
	}

	.revoke-btn {
		flex-shrink: 0;
		background: var(--color-bg-soft);
		border: none;
		border-radius: 999px;
		padding: 8px 14px;
		font-size: 12px;
		font-weight: 700;
		color: #d64545;
		cursor: pointer;
	}

	.revoke-btn:disabled {
		opacity: 0.6;
		cursor: default;
	}

	.revoke-btn:active {
		transform: scale(0.95);
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
		.page-header,
		.empty-state,
		.share-card {
			animation: none !important;
			opacity: 1;
		}
	}

	/* PC/tablet: same full-bleed break-out as the other screens. The list
	   itself doesn't need much rework — just enough room for two columns
	   instead of one long mobile-width strip. */
	@media (min-width: 768px) {
		.mypage {
			width: 100vw;
			margin-left: calc(50% - 50vw);
		}

		.mypage-inner {
			max-width: 900px;
			margin: 0 auto;
			padding: 0 40px;
		}

		.page-header h1 {
			font-size: 26px;
		}

		.page-desc {
			font-size: 14px;
		}

		.share-list {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: 14px;
		}
	}
</style>
