<script lang="ts">
	import { stellars } from '$lib/data/stellars';
	import { PUBLIC_LOGIN_URL } from '$env/static/public';
	import StellarOrbit from '$lib/components/StellarOrbit.svelte';

	let loggingIn = $state(false);

	function handleClick() {
		if (loggingIn) return;
		loggingIn = true;
		window.location.href = PUBLIC_LOGIN_URL;
	}
</script>

<section class="login">
	<div class="brand">
		<span class="brand-mark">STELINFO</span>
		<p class="brand-sub">스텔라이브 팔로우&정보 확인 서비스</p>
	</div>

	<StellarOrbit {stellars} />

	<div class="login-box">
		<h1>스텔인포에 오신 것을 환영해요</h1>
		<p class="desc">치지직 계정으로 로그인 후<br />스텔라의 팔로우 정보를 확인해보세요.</p>
		<button class="chzzk-btn" onclick={handleClick} disabled={loggingIn}>
			{#if loggingIn}
				<span class="spinner" aria-hidden="true"></span>
				연동하는 중...
			{:else}
				<span class="chzzk-dot" aria-hidden="true"></span>
				치지직 로그인
			{/if}
		</button>
		<p class="disclaimer">본 서비스는 개인이 제작한 비공식 서비스입니다.</p>
	</div>
</section>

<style>
	.login {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.brand {
		margin-top: 12px;
	}

	.brand-mark {
		font-size: 28px;
		font-weight: 800;
		letter-spacing: 0.06em;
		color: var(--color-primary);
	}

	.brand-sub {
		margin-top: 6px;
		font-size: 13px;
		color: var(--color-text-muted);
	}

	.login-box {
		width: 100%;
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-soft);
		padding: 28px 22px calc(24px + var(--safe-bottom));
	}

	.login-box h1 {
		font-size: 19px;
		font-weight: 700;
	}

	.desc {
		margin-top: 10px;
		font-size: 14px;
		line-height: 1.5;
		color: var(--color-text-muted);
	}

	.chzzk-btn {
		margin-top: 22px;
		width: 100%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		border: none;
		border-radius: var(--radius-sm);
		padding: 15px 18px;
		background: #15181b;
		color: #ffffff;
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.15s ease;
	}

	.chzzk-btn:active {
		transform: scale(0.98);
	}

	.chzzk-btn:disabled {
		opacity: 0.75;
		cursor: default;
	}

	.chzzk-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #00ffa3;
	}

	.spinner {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		border: 2px solid rgba(255, 255, 255, 0.35);
		border-top-color: #ffffff;
		animation: spin 0.8s linear infinite;
	}

	.disclaimer {
		margin-top: 14px;
		font-size: 11px;
		color: var(--color-text-muted);
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
