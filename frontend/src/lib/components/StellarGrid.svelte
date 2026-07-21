<script lang="ts">
	import type { StellarProfile } from '$lib/types';

	let {
		stellars,
		onSelect,
		loadingId
	}: {
		stellars: StellarProfile[];
		onSelect: (id: string) => void;
		loadingId: string | null;
	} = $props();

	const columns = 3;
</script>

<section class="select-screen">
	<header class="select-header">
		<div class="user-chip">
			<div class="user-avatar">파</div>
			<div class="user-text">
				<p class="user-hello">안녕하세요 👋</p>
				<p class="user-name">치지직 유저님</p>
			</div>
			<span class="connected-badge">연동됨</span>
		</div>
		<h1>확인할 스텔라를 선택해주세요</h1>
		<p class="select-desc">선택한 스텔라와의 팔로우・구독 기록을 보여드려요.</p>
	</header>

	<div class="stellar-grid">
		{#each stellars as s, i (s.id)}
			<button
				class="stellar-tile"
				style={`--tile-color:${s.color}; --delay:${Math.floor(i / columns) * 70 + (i % columns) * 25}ms`}
				onclick={() => onSelect(s.id)}
				disabled={loadingId !== null}
			>
				<span class="tile-avatar" class:is-loading={loadingId === s.id}>
					<img src={s.image} alt={s.engName} loading="lazy" />
				</span>
				<span class="tile-name">{s.shortName}</span>
			</button>
		{/each}
	</div>
</section>

<style>
	.select-screen {
		flex: 1;
		display: flex;
		flex-direction: column;
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
		transition: transform 0.15s ease;
	}

	.stellar-tile:active .tile-avatar {
		transform: scale(0.94);
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
		.user-chip,
		.select-header h1,
		.select-desc,
		.stellar-tile {
			animation: none;
			opacity: 1;
		}
	}
</style>
