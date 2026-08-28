<script lang="ts">
	import { goto } from '$app/navigation';
	import type { ChzzkUser } from '$lib/types';

	let { user, onLogout }: { user: ChzzkUser; onLogout: () => void | Promise<void> } = $props();

	let open = $state(false);
	let drawerEl = $state<HTMLElement | null>(null);

	// Drag-to-close: tracked with plain touch events (not Pointer Events +
	// setPointerCapture) so a normal tap on a menu item still synthesizes a
	// click underneath — capture would redirect that click to the drawer
	// itself. `horizontalIntent` is decided once the finger clears a small
	// deadzone, so short taps are never mistaken for a drag.
	let dragging = $state(false);
	let dragX = $state(0);
	let touchStartX = 0;
	let touchStartY = 0;
	let horizontalIntent = false;

	function openMenu() {
		open = true;
	}

	function close() {
		open = false;
		dragX = 0;
	}

	function go(path: string) {
		close();
		goto(path);
	}

	async function handleLogout() {
		close();
		await onLogout();
	}

	function onTouchStart(e: TouchEvent) {
		const t = e.touches[0];
		touchStartX = t.clientX;
		touchStartY = t.clientY;
		horizontalIntent = false;
		dragging = false;
	}

	function onTouchMove(e: TouchEvent) {
		const t = e.touches[0];
		const dx = t.clientX - touchStartX;
		const dy = t.clientY - touchStartY;

		if (!horizontalIntent) {
			if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
			// Drawer now lives on the left edge, so closing swipes go left.
			horizontalIntent = Math.abs(dx) > Math.abs(dy) && dx < 0;
			if (!horizontalIntent) return;
			dragging = true;
		}

		e.preventDefault();
		dragX = Math.min(0, dx);
	}

	function onTouchEnd() {
		if (!dragging) {
			horizontalIntent = false;
			return;
		}
		dragging = false;
		horizontalIntent = false;
		const width = drawerEl?.offsetWidth ?? 300;
		if (-dragX > width * 0.3) {
			close();
		} else {
			dragX = 0;
		}
	}

	// Svelte registers touchmove listeners as passive by default (for
	// scroll perf), which silently breaks preventDefault — wired manually
	// here with { passive: false } instead of the ontouchmove attribute.
	$effect(() => {
		if (!drawerEl) return;
		drawerEl.addEventListener('touchmove', onTouchMove, { passive: false });
		return () => drawerEl?.removeEventListener('touchmove', onTouchMove);
	});
</script>

<!-- PC/tablet: direct shortcut links instead of hiding navigation behind a
     hamburger — a drawer makes more sense on mobile where top-bar space is
     tight, but just adds an extra click on a wide screen with room to spare. -->
<nav class="desktop-nav" aria-label="바로가기">
	<button class="nav-link" onclick={() => go('/mypage')}>마이페이지</button>
	<button class="nav-link" onclick={() => go('/verify')}>인증 확인</button>
	<button class="nav-link nav-link--danger" onclick={handleLogout}>로그아웃</button>
</nav>

<button class="menu-trigger" onclick={openMenu} aria-label="메뉴 열기">
	<img src="/icons/menu.svg" alt="" />
</button>

<button
	class="menu-overlay"
	class:visible={open}
	onclick={close}
	aria-label="메뉴 닫기"
	tabindex={open ? 0 : -1}
></button>

<nav
	class="menu-drawer"
	class:visible={open}
	class:dragging
	bind:this={drawerEl}
	style={dragging ? `transform: translateX(${dragX}px)` : undefined}
	aria-hidden={!open}
	aria-label="사이드 메뉴"
	ontouchstart={onTouchStart}
	ontouchend={onTouchEnd}
	ontouchcancel={onTouchEnd}
>
	<span class="drag-handle" aria-hidden="true"></span>

	<div class="menu-user">
		<div class="user-avatar">{user.channelName.charAt(0)}</div>
		<div class="user-text">
			<p class="user-hello">안녕하세요 👋</p>
			<p class="user-name">{user.channelName}님</p>
		</div>
	</div>

	<div class="menu-items">
		<button class="menu-item" onclick={() => go('/mypage')}>마이페이지</button>
		<button class="menu-item" onclick={() => go('/verify')}>인증 확인</button>
		<button class="menu-item menu-item--danger" onclick={handleLogout}>로그아웃</button>
	</div>
</nav>

<style>
	.menu-trigger {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: var(--color-surface);
		border: none;
		border-radius: 999px;
		box-shadow: var(--shadow-soft);
		cursor: pointer;
		opacity: 0;
		animation: fade-up 0.3s ease-out 0ms both;
	}

	.menu-trigger:active {
		transform: scale(0.94);
	}

	.menu-trigger img {
		width: 18px;
		height: 18px;
	}

	.desktop-nav {
		display: none;
	}

	.nav-link {
		display: inline-flex;
		align-items: center;
		background: var(--color-surface);
		border: none;
		border-radius: 999px;
		padding: 8px 16px;
		font-size: 13px;
		font-weight: 600;
		color: var(--color-text);
		box-shadow: var(--shadow-soft);
		cursor: pointer;
		opacity: 0;
		animation: fade-up 0.3s ease-out 0ms both;
	}

	.nav-link:active {
		transform: scale(0.96);
	}

	.nav-link--danger {
		color: #d64545;
	}

	.menu-overlay {
		position: fixed;
		inset: 0;
		border: none;
		background: rgba(20, 18, 40, 0.35);
		z-index: 40;
		cursor: default;
		opacity: 0;
		pointer-events: none;
		transition:
			opacity 0.24s ease,
			visibility 0.24s;
		visibility: hidden;
	}

	.menu-overlay.visible {
		opacity: 1;
		pointer-events: auto;
		visibility: visible;
	}

	.menu-drawer {
		position: fixed;
		top: 0;
		left: 0;
		bottom: 0;
		width: min(78vw, 300px);
		background: var(--color-surface);
		box-shadow: 12px 0 32px rgba(20, 18, 40, 0.18);
		z-index: 41;
		padding: calc(var(--safe-top) + 24px) 20px calc(var(--safe-bottom) + 24px);
		display: flex;
		flex-direction: column;
		transform: translateX(-100%);
		transition: transform 0.26s cubic-bezier(0.22, 1, 0.36, 1);
		touch-action: pan-y;
	}

	.menu-drawer.visible {
		transform: translateX(0);
	}

	.menu-drawer.dragging {
		transition: none;
	}

	.drag-handle {
		align-self: center;
		width: 36px;
		height: 4px;
		border-radius: 999px;
		background: var(--color-bg-soft);
		margin-bottom: 12px;
	}

	.menu-user {
		display: flex;
		align-items: center;
		gap: 10px;
		padding-bottom: 18px;
		border-bottom: 1px solid var(--color-bg-soft);
	}

	.user-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, var(--color-primary), var(--color-primary-2));
		color: #fff;
		font-size: 15px;
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
		font-size: 14px;
		font-weight: 700;
	}

	.menu-items {
		margin-top: 8px;
		display: flex;
		flex-direction: column;
	}

	.menu-item {
		text-align: left;
		background: none;
		border: none;
		padding: 16px 4px;
		font-size: 15px;
		font-weight: 600;
		color: var(--color-text);
		border-bottom: 1px solid var(--color-bg-soft);
		cursor: pointer;
	}

	.menu-item:active {
		opacity: 0.7;
	}

	.menu-item--danger {
		color: #d64545;
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
		.menu-trigger,
		.nav-link {
			animation: none;
			opacity: 1;
		}
		.menu-overlay,
		.menu-drawer {
			transition: none;
		}
	}

	/* PC/tablet: swap the hamburger+drawer for inline shortcut links. The
	   drawer markup stays in the DOM either way — it just can no longer be
	   opened, since its only trigger is hidden here too. */
	@media (min-width: 768px) {
		.menu-trigger {
			display: none;
		}

		.desktop-nav {
			display: flex;
			align-items: center;
			gap: 8px;
		}
	}
</style>
