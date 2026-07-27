<script lang="ts">
	import QrScanner from 'qr-scanner';
	import { prefersReducedMotion } from 'svelte/motion';
	import { fade, scale } from 'svelte/transition';

	let { onScan, onClose }: { onScan: (id: string) => void; onClose: () => void } = $props();

	let videoEl = $state<HTMLVideoElement | null>(null);
	let errorMessage = $state('');
	let lastScannedId = $state('');
	let scannedCount = $state(0);

	let lastScannedAt = 0;
	const RESCAN_COOLDOWN_MS = 2000;

	function handleResult(text: string) {
		const id = text.trim();
		if (!id) return;
		const now = Date.now();
		// The same code stays in frame for many consecutive scans — only
		// forward it once per cooldown window (always forward a *different*
		// code immediately, e.g. scanning several people back to back).
		if (id === lastScannedId && now - lastScannedAt < RESCAN_COOLDOWN_MS) return;
		lastScannedId = id;
		lastScannedAt = now;
		scannedCount += 1;
		onScan(id);
	}

	$effect(() => {
		if (!videoEl) return;

		const scanner = new QrScanner(videoEl, (result) => handleResult(result.data), {
			preferredCamera: 'environment',
			highlightScanRegion: true,
			highlightCodeOutline: true,
			returnDetailedScanResult: true
		});

		scanner.start().catch(() => {
			errorMessage = '카메라를 열 수 없어요. 카메라 권한을 허용했는지 확인해주세요.';
		});

		return () => {
			scanner.stop();
			scanner.destroy();
		};
	});
</script>

<button
	class="scan-overlay"
	onclick={onClose}
	aria-label="닫기"
	transition:fade={{ duration: prefersReducedMotion.current ? 0 : 200 }}
></button>
<div
	class="scan-panel"
	role="dialog"
	aria-modal="true"
	aria-label="QR 인식"
	transition:scale={{ duration: prefersReducedMotion.current ? 0 : 220, start: 0.94 }}
>
	<div class="scan-header">
		<h2>QR 인식</h2>
		<button class="scan-close" onclick={onClose} aria-label="닫기">✕</button>
	</div>

	{#if errorMessage}
		<p class="error-text">{errorMessage}</p>
	{:else}
		<div class="video-wrap">
			<video bind:this={videoEl} class="scan-video" muted playsinline></video>
		</div>
		<p class="scan-status">
			{#if lastScannedId}
				✅ 방금 추가: <span class="mono">{lastScannedId}</span>
			{:else}
				QR을 화면 안에 비춰주세요
			{/if}
		</p>
		<p class="scan-count">총 {scannedCount}개 인식됨 · 계속 스캔해서 여러 명을 한 번에 추가할 수 있어요.</p>
	{/if}

	<button class="done-btn" onclick={onClose}>완료</button>
</div>

<style>
	.scan-overlay {
		position: fixed;
		inset: 0;
		border: none;
		background: rgba(20, 18, 40, 0.6);
		z-index: 60;
		cursor: default;
	}

	.scan-panel {
		position: fixed;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: min(90vw, 380px);
		max-height: 86vh;
		overflow-y: auto;
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		padding: 20px;
		box-shadow: var(--shadow-soft);
		z-index: 61;
	}

	.scan-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.scan-header h2 {
		font-size: 17px;
		font-weight: 800;
	}

	.scan-close {
		border: none;
		background: var(--color-bg-soft);
		width: 28px;
		height: 28px;
		border-radius: 50%;
		font-size: 13px;
		color: var(--color-text-muted);
		cursor: pointer;
	}

	.video-wrap {
		margin-top: 14px;
		border-radius: var(--radius-md);
		overflow: hidden;
		background: #000;
		aspect-ratio: 1 / 1;
	}

	.scan-video {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.scan-status {
		margin-top: 12px;
		font-size: 14px;
		font-weight: 700;
		text-align: center;
	}

	.mono {
		font-family: monospace;
	}

	.scan-count {
		margin-top: 4px;
		font-size: 11px;
		color: var(--color-text-muted);
		text-align: center;
		line-height: 1.5;
	}

	.error-text {
		margin-top: 14px;
		font-size: 13px;
		color: #d64545;
		line-height: 1.5;
	}

	.done-btn {
		margin-top: 16px;
		width: 100%;
		border: none;
		border-radius: var(--radius-sm);
		padding: 13px;
		background: var(--color-primary);
		color: #fff;
		font-size: 15px;
		font-weight: 700;
		cursor: pointer;
	}
</style>
