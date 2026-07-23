<script lang="ts">
	import type { ChzzkUser, StellarProfile } from '$lib/types';
	import StellarTile from '$lib/components/StellarTile.svelte';

	let {
		stellars,
		user,
		onSelect,
		onLogout,
		loadingId
	}: {
		stellars: StellarProfile[];
		user: ChzzkUser;
		onSelect: (id: string) => void;
		onLogout: () => void;
		loadingId: string | null;
	} = $props();

	const columns = 3;
</script>

<section class="select-screen">
	<div class="select-inner">
		<header class="select-header">
			<button class="logout-btn" onclick={onLogout}>로그아웃</button>
			<div class="user-chip">
				<div class="user-avatar">{user.channelName.charAt(0)}</div>
				<div class="user-text">
					<p class="user-hello">안녕하세요 👋</p>
					<p class="user-name">{user.channelName}님</p>
				</div>
				<span class="connected-badge">연동됨</span>
			</div>
			<h1>확인할 스텔라를 선택해주세요</h1>
			<p class="select-desc">선택한 스텔라와의 팔로우・구독 기록과 정보를 보여드려요.</p>
		</header>

		<div class="stellar-grid">
			{#each stellars as s, i (s.id)}
				<StellarTile
					stellar={s}
					loading={loadingId === s.id}
					disabled={loadingId !== null}
					delayMs={Math.floor(i / columns) * 70 + (i % columns) * 25}
					onSelect={() => onSelect(s.id)}
				/>
			{/each}
		</div>
	</div>
</section>

<style>
	.select-screen {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.select-inner {
		flex: 1;
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	.select-header {
		position: relative;
	}

	.logout-btn {
		position: absolute;
		top: 0;
		right: 0;
		background: var(--color-surface);
		border: none;
		border-radius: 999px;
		padding: 8px 14px;
		font-size: 11px;
		font-weight: 600;
		color: var(--color-text-muted);
		box-shadow: var(--shadow-soft);
		cursor: pointer;
		opacity: 0;
		animation: fade-up 0.3s ease-out 0ms both;
	}

	.logout-btn:active {
		transform: scale(0.96);
	}

	.user-chip {
		display: flex;
		align-items: center;
		gap: 10px;
		background: var(--color-surface);
		border-radius: 999px;
		padding: 8px 14px 8px 8px;
		box-shadow: var(--shadow-soft);
		width: fit-content;
		opacity: 0;
		animation: fade-up 0.3s ease-out 0ms both;
	}

	.user-avatar {
		width: 34px;
		height: 34px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, var(--color-primary), var(--color-primary-2));
		color: #fff;
		font-size: 13px;
		font-weight: 700;
	}

	.user-text {
		line-height: 1.25;
	}

	.user-hello {
		font-size: 11px;
		color: var(--color-text-muted);
	}

	.user-name {
		font-size: 13px;
		font-weight: 700;
	}

	.connected-badge {
		margin-left: 4px;
		font-size: 10px;
		font-weight: 700;
		color: var(--color-primary);
		background: var(--color-bg-soft);
		padding: 4px 8px;
		border-radius: 999px;
	}

	.select-header h1 {
		margin-top: 20px;
		font-size: 20px;
		font-weight: 800;
		line-height: 1.35;
		opacity: 0;
		animation: fade-up 0.3s ease-out 60ms both;
	}

	.select-desc {
		margin-top: 6px;
		font-size: 13px;
		color: var(--color-text-muted);
		opacity: 0;
		animation: fade-up 0.3s ease-out 100ms both;
	}

	.stellar-grid {
		margin-top: 22px;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px 12px;
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

	@media (prefers-reduced-motion: reduce) {
		.logout-btn,
		.user-chip,
		.select-header h1,
		.select-desc {
			animation: none;
			opacity: 1;
		}
	}

	/* PC/tablet: same full-bleed break-out as the login screen (escapes
	   .app-shell's shared max-width:480px without loosening it globally),
	   but re-centers at a wider-but-bounded column instead of going edge to
	   edge — a grid of small tiles stretched across an ultra-wide viewport
	   would just look sparse, not more useful. Two layers because the
	   break-out math (margin-left: calc(50% - 50vw)) only centers correctly
	   when the element is truly 100vw wide; capping width with max-width on
	   the same element would throw that off, so the cap + centering lives
	   on a separate inner element instead. */
	@media (min-width: 768px) {
		.select-screen {
			width: 100vw;
			margin-left: calc(50% - 50vw);
		}

		.select-inner {
			max-width: 1080px;
			margin: 0 auto;
			padding: 0 40px;
		}

		.select-header h1 {
			font-size: 26px;
		}

		.select-desc {
			font-size: 14px;
		}

		.stellar-grid {
			margin-top: 32px;
			grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
			gap: 28px 20px;
		}
	}
</style>
