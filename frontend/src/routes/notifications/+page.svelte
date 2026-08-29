<script lang="ts">
	import { goto } from '$app/navigation';
	import { stellars } from '$lib/data/stellars';
	import { auth } from '$lib/state/auth.svelte';
	import {
		disableStellarNotification,
		enableStellarNotification,
		getEnabledStellarIds,
		getNotificationPermission,
		type PermissionState
	} from '$lib/state/pushNotifications';

	let enabled = $state<Set<string>>(new Set());
	let loading = $state(true);
	let pendingId = $state<string | null>(null);
	let errorMessage = $state('');
	let permission = $state<PermissionState>('default');

	$effect(() => {
		if (auth.checked && !auth.user) goto('/');
	});

	$effect(() => {
		permission = getNotificationPermission();
	});

	$effect(() => {
		if (!auth.user) return;
		getEnabledStellarIds()
			.then((ids) => (enabled = ids))
			.finally(() => (loading = false));
	});

	async function toggle(stellarId: string) {
		if (permission === 'unsupported') {
			errorMessage = '이 브라우저에서는 알림 기능을 사용할 수 없어요.';
			return;
		}

		errorMessage = '';
		pendingId = stellarId;
		const wasOn = enabled.has(stellarId);
		try {
			if (wasOn) {
				await disableStellarNotification(stellarId);
				const next = new Set(enabled);
				next.delete(stellarId);
				enabled = next;
			} else {
				await enableStellarNotification(stellarId);
				enabled = new Set(enabled).add(stellarId);
			}
		} catch {
			errorMessage =
				Notification.permission === 'denied'
					? '브라우저 알림 권한이 차단되어 있어요. 브라우저 설정에서 이 사이트의 알림을 허용해주세요.'
					: '설정 변경에 실패했어요. 잠시 후 다시 시도해주세요.';
		} finally {
			permission = getNotificationPermission();
			pendingId = null;
		}
	}
</script>

<section class="notifications">
	<div class="notifications-inner">
		<header class="page-header">
			<button class="back-btn" onclick={() => goto('/select')} aria-label="목록으로 돌아가기">
				<span aria-hidden="true">←</span> 목록으로
			</button>
			<div class="title-row">
				<h1>알림 설정</h1>
				<span class="beta-badge">베타</span>
			</div>
			<p class="page-desc">
				방송이 시작되면 이 브라우저로 알림을 보내드려요. 아직 베타 테스트 중인 기능이라 기기나
				브라우저에 따라 알림이 늦게 오거나 오지 않을 수 있어요.
			</p>
		</header>

		{#if permission === 'unsupported'}
			<p class="notice notice--warn">이 브라우저 또는 환경에서는 알림 기능을 지원하지 않아요.</p>
		{:else if permission === 'denied'}
			<p class="notice notice--warn">
				브라우저 알림 권한이 차단되어 있어요. 브라우저 설정에서 이 사이트의 알림을 허용해주세요.
			</p>
		{/if}

		{#if errorMessage}
			<p class="notice notice--error">{errorMessage}</p>
		{/if}

		{#if loading}
			<p class="status-text">불러오는 중...</p>
		{:else}
			<ul class="stellar-list">
				{#each stellars as s, i (s.id)}
					<li class="stellar-row" style={`--accent:${s.color}; animation-delay:${i * 40}ms`}>
						<img class="stellar-avatar" src={s.image} alt="" />
						<div class="stellar-text">
							<p class="stellar-name">{s.korName}</p>
							<p class="stellar-sub">방송 시작 알림</p>
						</div>
						<button
							class="toggle"
							class:on={enabled.has(s.id)}
							disabled={pendingId === s.id || permission === 'unsupported'}
							onclick={() => toggle(s.id)}
							role="switch"
							aria-checked={enabled.has(s.id)}
							aria-label={`${s.korName} 방송 시작 알림`}
						>
							<span class="toggle-knob"></span>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>

<style>
	.notifications {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.notifications-inner {
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

	.title-row {
		margin-top: 18px;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.page-header h1 {
		font-size: 20px;
		font-weight: 800;
	}

	.beta-badge {
		font-size: 10px;
		font-weight: 700;
		color: var(--color-primary);
		background: var(--color-bg-soft);
		padding: 4px 8px;
		border-radius: 999px;
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

	.notice {
		margin-top: 16px;
		border-radius: var(--radius-sm);
		padding: 10px 14px;
		font-size: 12px;
		font-weight: 600;
		opacity: 0;
		animation: fade-up 0.3s ease-out both;
	}

	.notice--warn {
		background: var(--color-bg-soft);
		color: var(--color-text-muted);
	}

	.notice--error {
		background: rgba(214, 69, 69, 0.1);
		color: #d64545;
	}

	.stellar-list {
		margin-top: 20px;
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.stellar-row {
		position: relative;
		background: var(--color-surface);
		border-radius: var(--radius-md);
		padding: 12px 16px;
		box-shadow: 0 4px 12px rgba(134, 127, 219, 0.12);
		display: flex;
		align-items: center;
		gap: 12px;
		opacity: 0;
		animation: fade-up 0.3s ease-out both;
		border-left: 4px solid var(--accent);
	}

	.stellar-avatar {
		width: 38px;
		height: 38px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
	}

	.stellar-text {
		flex: 1;
		min-width: 0;
	}

	.stellar-name {
		font-size: 14px;
		font-weight: 700;
	}

	.stellar-sub {
		margin-top: 2px;
		font-size: 11px;
		color: var(--color-text-muted);
	}

	.toggle {
		position: relative;
		flex-shrink: 0;
		width: 44px;
		height: 26px;
		border-radius: 999px;
		border: none;
		background: var(--color-bg-soft);
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.toggle.on {
		background: var(--color-primary);
	}

	.toggle:disabled {
		opacity: 0.6;
		cursor: default;
	}

	.toggle-knob {
		position: absolute;
		top: 3px;
		left: 3px;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #fff;
		box-shadow: 0 1px 3px rgba(20, 18, 40, 0.25);
		transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.toggle.on .toggle-knob {
		transform: translateX(18px);
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
		.notice,
		.stellar-row {
			animation: none !important;
			opacity: 1;
		}
	}

	/* PC/tablet: same full-bleed break-out as the other screens. */
	@media (min-width: 768px) {
		.notifications {
			width: 100vw;
			margin-left: calc(50% - 50vw);
		}

		.notifications-inner {
			max-width: 1080px;
			margin: 0 auto;
			padding: 0 40px;
		}

		.page-header h1 {
			font-size: 26px;
		}

		.page-desc {
			font-size: 14px;
		}

		.stellar-list {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: 12px;
		}
	}
</style>
