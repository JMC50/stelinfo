<script lang="ts">
	import type { ChzzkUser, StellarProfile } from '$lib/types';
	import SideMenu from '$lib/components/SideMenu.svelte';
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

	const columns = 4;

	// Debut generations: the first 3 (Gangzi, Ayatsuno_yuni, Sakihane_huya)
	// share a row, everyone after is grouped 4-per-row — each group starts
	// its own grid row rather than wrapping wherever the flat column count
	// happens to land, so a generation's members always line up together.
	function groupByGeneration(list: StellarProfile[]): StellarProfile[][] {
		const groups: StellarProfile[][] = [];
		let i = 0;
		if (list.length > 0) {
			groups.push(list.slice(0, 3));
			i = 3;
		}
		while (i < list.length) {
			groups.push(list.slice(i, i + columns));
			i += columns;
		}
		return groups;
	}

	let groups = $derived(groupByGeneration(stellars));
</script>

<section class="select-screen">
	<div class="select-inner">
		<header class="select-header">
			<div class="header-top">
				<SideMenu {user} onLogout={onLogout} />
				<div class="user-chip">
					<div class="user-avatar">{user.channelName.charAt(0)}</div>
					<div class="user-text">
						<p class="user-hello">안녕하세요 👋</p>
						<p class="user-name">{user.channelName}님</p>
					</div>
					<span class="connected-badge">연동됨</span>
				</div>
			</div>
			<h1>확인할 스텔라를 선택해주세요</h1>
			<p class="select-desc">선택한 스텔라와의 팔로우・구독 기록과 정보를 보여드려요.</p>
		</header>

		<div class="stellar-groups">
			{#each groups as group, g (group[0]?.id ?? g)}
				<div class="stellar-grid">
					{#each group as s, j (s.id)}
						<StellarTile
							stellar={s}
							loading={loadingId === s.id}
							disabled={loadingId !== null}
							delayMs={g * 70 + j * 25}
							onSelect={() => onSelect(s.id)}
						/>
					{/each}
				</div>
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

	.header-top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 10px;
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

	.stellar-groups {
		margin-top: 22px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.stellar-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 16px 10px;
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

		/* Desktop keeps the original flat grid (no per-generation rows): the
		   group wrapper collapses out of layout via display:contents, which
		   promotes each .stellar-grid's StellarTile children to be direct
		   items of .stellar-groups — so .stellar-groups itself becomes the
		   single grid they all auto-fill-wrap in, same as before grouping
		   was added, with no DOM duplication needed to get back to it. */
		.stellar-groups {
			margin-top: 32px;
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
			gap: 28px 20px;
		}

		.stellar-grid {
			display: contents;
		}
	}
</style>
