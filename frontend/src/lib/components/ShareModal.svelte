<script lang="ts">
	import { toPng } from 'html-to-image';
	import QRCode from 'qrcode';
	import { prefersReducedMotion } from 'svelte/motion';
	import { fade, scale } from 'svelte/transition';
	import { auth } from '$lib/state/auth.svelte';
	import { createShare, revokeShare } from '$lib/state/shareApi';
	import type { ShareRecord } from '$lib/types';

	let {
		stellarId,
		memberName,
		engName,
		image,
		oshimark,
		oshimark1,
		hex,
		channelName,
		xId,
		onClose
	}: {
		stellarId: string;
		memberName: string;
		engName: string;
		image: string;
		oshimark: string;
		oshimark1: string;
		hex: string;
		channelName: string;
		xId: string | null;
		onClose: () => void;
	} = $props();

	let step = $state<'input' | 'card'>('input');
	// Pre-filled from whatever was saved last time, but left editable — X
	// handles change, so this is a starting point, not an auto-skip. This
	// component is remounted fresh every time the modal opens, so reading
	// xId once here (rather than reactively) is intentional.
	// svelte-ignore state_referenced_locally
	let handle = $state(xId ?? '');
	let submitting = $state(false);
	let errorMessage = $state('');
	let share = $state<ShareRecord | null>(null);
	let qrDataUrl = $state('');
	let cardEl = $state<HTMLDivElement | null>(null);
	let frameEl = $state<HTMLDivElement | null>(null);
	let dividerEl = $state<HTMLDivElement | null>(null);
	let downloading = $state(false);
	let deleting = $state(false);
	let deleteError = $state('');

	// Ticket-stub notch position, in px from the card's own top edge — used
	// to punch two real transparent holes (see .card-frame's mask-image)
	// rather than painting opaque circles that only look right against a
	// white background. -999 keeps them off-canvas until measured, since
	// the divider's position shifts with hero content height.
	let notchY = $state(-999);

	// Diffing raw elapsed ms (÷ 86_400_000) only ticks over once a full 24h
	// has passed since the exact follow timestamp, so checking again the
	// next calendar day can still show the same count. Truncate both sides
	// to midnight first so this increments once per calendar day instead.
	function daysSince(dateStr: string): number {
		const start = new Date(dateStr.replace(' ', 'T'));
		const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
		return Math.round((today - startDay) / 86_400_000) + 1;
	}

	$effect(() => {
		if (step !== 'card') return;
		let cancelled = false;
		const measure = () => {
			if (cancelled || !frameEl || !dividerEl) return;
			notchY = dividerEl.getBoundingClientRect().top - frameEl.getBoundingClientRect().top;
		};
		requestAnimationFrame(measure);
		document.fonts.ready.then(measure);
		return () => {
			cancelled = true;
		};
	});

	let followDays = $derived.by(() => {
		if (!share?.followDate) return null;
		return daysSince(share.followDate);
	});

	let issuedDate = $derived(
		share ? new Date(share.updatedAt.replace(' ', 'T') + 'Z').toLocaleDateString('ko-KR') : ''
	);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		const trimmed = handle.trim().replace(/^@/, '');
		if (!trimmed) {
			errorMessage = 'X ID를 입력해주세요.';
			return;
		}

		submitting = true;
		errorMessage = '';
		try {
			share = await createShare(stellarId, trimmed);
			auth.setXId(trimmed);
			// Plain ID, not a URL — the verify page's scanner reads this
			// straight into its id list, and it doubles as a manually
			// typeable fallback if the QR won't scan. Generated well above
			// its ~64px display size so it's always scaled down (never up)
			// when captured at pixelRatio 3 below — upscaling is what would
			// soften its edges and hurt scannability.
			qrDataUrl = await QRCode.toDataURL(share.id, {
				width: 256,
				margin: 1,
				color: { dark: '#1a1a2e', light: '#ffffff' }
			});
			step = 'card';
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : '카드 생성에 실패했어요.';
		} finally {
			submitting = false;
		}
	}

	async function handleDownload() {
		if (!cardEl) return;
		downloading = true;
		try {
			await document.fonts.ready;
			// html-to-image's first capture of a given node is unreliable —
			// it can measure/rasterize before font/image embedding actually
			// settles, which is what was shaving the bottom off the export.
			// A throwaway warm-up render fixes the one that's kept.
			// pixelRatio 3 matches typical phone screen density (source
			// avatar art and the QR above are both high-res enough to hold
			// up at this scale without softening).
			await toPng(cardEl, { pixelRatio: 4 });
			const dataUrl = await toPng(cardEl, { pixelRatio: 4 });
			const link = document.createElement('a');
			link.download = `stelinfo-${stellarId}-${share?.id}.png`;
			link.href = dataUrl;
			link.click();
		} finally {
			downloading = false;
		}
	}

	async function handleDelete() {
		if (!share) return;
		if (
			!confirm(
				'삭제하면 다른 사람이 이 인증ID로 더 이상 조회할 수 없어요. 필요하면 나중에 다시 만들 수 있어요. 삭제할까요?'
			)
		)
			return;

		deleting = true;
		deleteError = '';
		try {
			const ok = await revokeShare(share.id);
			if (ok) {
				onClose();
			} else {
				deleteError = '삭제에 실패했어요.';
			}
		} finally {
			deleting = false;
		}
	}
</script>

<button
	class="modal-overlay"
	onclick={onClose}
	aria-label="닫기"
	transition:fade={{ duration: prefersReducedMotion.current ? 0 : 200 }}
></button>
<div
	class="modal-panel"
	role="dialog"
	aria-modal="true"
	aria-label="공유 카드 만들기"
	transition:scale={{ duration: prefersReducedMotion.current ? 0 : 220, start: 0.94 }}
>
	{#if step === 'input'}
		<h2>공유 카드 만들기</h2>
		<p class="modal-desc">
			나눔 주최자가 확인할 수 있도록, 팔로우・구독 인증 카드를 만들어요.<br />
			트위터(X) 계정명을 함께 표시해서 다른 사람이 이 카드를 도용하지 못하도록 해요.
		</p>
		<form onsubmit={handleSubmit}>
			<label for="handle">X ID</label>
			<div class="handle-input">
				<span class="at">@</span>
				<input id="handle" type="text" placeholder="my_twitter_id" bind:value={handle} maxlength="40" />
			</div>
			{#if errorMessage}<p class="error-text">{errorMessage}</p>{/if}
			<button class="submit-btn" type="submit" disabled={submitting}>
				{submitting ? '생성하는 중...' : '카드 생성'}
			</button>
		</form>
	{:else if share}
		<h2>공유 카드가 만들어졌어요</h2>

		<div class="card-export" bind:this={cardEl}>
			<div class="card-frame" bind:this={frameEl} style={`--stellar-color:${hex}; --notch-y:${notchY}px`}>
				<div class="card-clip" aria-hidden="true">
					<div class="card-watermark card-watermark--top">{oshimark1}</div>
					<div class="card-watermark card-watermark--bottom">{oshimark}</div>
				</div>

				<div class="card-top">
					<span class="card-brand">STELINFO 인증카드</span>
					<span class="card-date">{issuedDate}</span>
				</div>

				<div class="card-hero">
					<div class="card-avatar-ring">
						<img src={image} alt="" class="card-avatar" />
						{#if oshimark}<span class="card-badge card-badge--left">{oshimark}</span>{/if}
						{#if oshimark1}<span class="card-badge card-badge--right">{oshimark1}</span>{/if}
					</div>
					<p class="card-member">{memberName}</p>
					<p class="card-eng">{engName}</p>
				</div>

				<div class="card-divider" bind:this={dividerEl}></div>

				<div class="card-status">
					<div class="card-pill" class:inactive={followDays === null}>
						<span class="pill-label">팔로우</span>
						<strong>{followDays !== null ? `${followDays}일째` : '미팔로우'}</strong>
					</div>
					<div class="card-pill" class:inactive={share.subscribeMonth === 0}>
						<span class="pill-label">구독</span>
						<strong>{share.subscribeMonth > 0 ? `${share.subscribeMonth}개월째` : '미구독'}</strong>
					</div>
				</div>

				<div class="card-footer">
					<div class="card-footer-info">
						<div class="card-footer-row">
							<span class="footer-icon-chip"><img src="/icons/chzzk.svg" alt="" /></span>
							<span>치지직 {channelName}</span>
						</div>
						<div class="card-footer-row">
							<span class="footer-icon-chip"><img src="/icons/x.svg" alt="" /></span>
							<span>X ID @{share.claimedHandle}</span>
						</div>
						<div class="card-footer-row">
							<span class="footer-icon-chip"><img src="/icons/link.svg" alt="" /></span>
							<span class="card-id">인증ID {share.id}</span>
						</div>
					</div>
					{#if qrDataUrl}
						<div class="card-qr-chip">
							<img src={qrDataUrl} alt="인증ID QR 코드" class="card-qr" />
						</div>
					{/if}
				</div>
			</div>
		</div>

		<p class="verify-note">서버가 직접 발급한 위조 방지 카드예요.</p>

		<div class="card-actions">
			<button class="submit-btn" onclick={handleDownload} disabled={downloading}>
				{downloading ? '저장하는 중...' : '이미지로 저장'}
			</button>
			<button class="delete-btn" onclick={handleDelete} disabled={deleting}>
				{deleting ? '삭제하는 중...' : '공유 정보 삭제'}
			</button>
		</div>
		{#if deleteError}<p class="error-text">{deleteError}</p>{/if}
		<button class="close-btn" onclick={onClose}>닫기</button>
	{/if}
</div>

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		border: none;
		background: rgba(20, 18, 40, 0.45);
		z-index: 50;
		cursor: default;
	}

	.modal-panel {
		position: fixed;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		/* Fixed width (not vw-scaled) so the card renders at the same
		   proportions on every device — it used to stretch up to 380px on
		   wide/desktop viewports, which squashed the ticket into a wider,
		   shorter shape than the mobile version. Content that needs more
		   room grows the card taller instead, since nothing here caps
		   height. The vw fallback only kicks in on screens too narrow to
		   fit 320px with margin. */
		width: min(320px, calc(100vw - 32px));
		max-height: 86vh;
		overflow-y: auto;
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		padding: 24px 20px;
		box-shadow: var(--shadow-soft);
		z-index: 51;
	}

	.modal-panel h2 {
		font-size: 17px;
		font-weight: 800;
	}

	.modal-desc {
		margin-top: 8px;
		font-size: 12px;
		line-height: 1.5;
		color: var(--color-text-muted);
	}

	form {
		margin-top: 16px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	label {
		font-size: 13px;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.handle-input {
		display: flex;
		align-items: center;
		border: 1px solid var(--color-bg-soft);
		border-radius: var(--radius-sm);
		padding: 10px 12px;
		gap: 2px;
	}

	.handle-input .at {
		color: var(--color-text-muted);
		font-weight: 700;
	}

	.handle-input input {
		border: none;
		outline: none;
		flex: 1;
		font-size: 14px;
	}

	.error-text {
		font-size: 12px;
		color: #d64545;
	}

	.submit-btn {
		margin-top: 6px;
		border: none;
		border-radius: var(--radius-sm);
		padding: 13px;
		background: var(--color-primary);
		color: #fff;
		font-size: 15px;
		font-weight: 700;
		cursor: pointer;
	}

	.submit-btn:disabled {
		opacity: 0.7;
		cursor: default;
	}

	.card-actions {
		margin-top: 6px;
		display: flex;
		gap: 8px;
	}

	/* .submit-btn also has a standalone (form) use above where it should
	   stay full-width — the flex sizing only kicks in inside this row. */
	.card-actions .submit-btn {
		margin-top: 0;
		flex: 1;
	}

	.delete-btn {
		flex: 1;
		border: none;
		border-radius: var(--radius-sm);
		padding: 13px;
		background: rgba(214, 69, 69, 0.12);
		color: #d64545;
		font-size: 15px;
		font-weight: 700;
		cursor: pointer;
	}

	.delete-btn:disabled {
		opacity: 0.7;
		cursor: default;
	}

	.close-btn {
		margin-top: 8px;
		width: 100%;
		border: none;
		background: none;
		color: var(--color-text-muted);
		font-size: 13px;
		font-weight: 600;
		padding: 10px;
		cursor: pointer;
	}

	/* --- Certificate card --- */

	/* The capture target for html-to-image. card-frame's box-shadow needs
	   room to render (it bleeds ~5px above, ~8px sides, ~11px below the
	   box) — without this buffer the export's canvas is sized exactly to
	   card-frame and the shadow gets cut off, worse at the bottom since
	   the shadow's y-offset pushes it down. Kept close to that minimum
	   (rather than padded generously) since extra room here just reads as
	   dead space around the card. */
	.card-export {
		margin-top: 6px;
		padding: 7px 10px 14px;
	}

	.card-frame {
		position: relative;
		border-radius: var(--radius-lg);
		padding: 20px 20px 24px;
		background: linear-gradient(
			165deg,
			var(--stellar-color) 0%,
			color-mix(in srgb, var(--stellar-color) 45%, #1a1a2e) 100%
		);
		color: #ffffff;
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
		animation: card-pop 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
		animation-delay: 0.05s;
		/* Punches two real transparent holes at the divider's edges (see
		   --notch-y, measured in JS from the divider's actual position)
		   instead of painting opaque circles that only look right against
		   a white page background. */
		mask-image:
			radial-gradient(circle 9px at 0px var(--notch-y), transparent 0%, transparent 99%, black 100%),
			radial-gradient(circle 9px at 100% var(--notch-y), transparent 0%, transparent 99%, black 100%);
		mask-composite: intersect;
	}

	/* Only the decorative watermark needs clipping to the card's rounded
	   silhouette. Keeping that clip off the card itself means the real
	   text content below is never at risk of being cut by it — which is
	   what made the PNG export shave the bottom row. */
	.card-clip {
		position: absolute;
		inset: 0;
		overflow: hidden;
		border-radius: inherit;
		pointer-events: none;
	}

	.card-watermark {
		position: absolute;
		font-size: 130px;
		line-height: 1;
		opacity: 0.14;
	}

	.card-watermark--bottom {
		right: -18px;
		bottom: -30px;
		transform: rotate(-8deg);
	}

	.card-watermark--top {
		left: -18px;
		top: -30px;
		transform: rotate(8deg);
	}

	.card-top {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.05em;
		opacity: 0.85;
	}

	.card-hero {
		position: relative;
		margin-top: 14px;
		text-align: center;
	}

	.card-avatar-ring {
		position: relative;
		width: 84px;
		height: 84px;
		margin: 0 auto;
		border-radius: 50%;
		padding: 3px;
		background: rgba(255, 255, 255, 0.55);
	}

	.card-avatar {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
		display: block;
	}

	.card-badge {
		position: absolute;
		bottom: -2px;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: var(--color-surface);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 13px;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
	}

	.card-badge--left {
		left: -4px;
	}

	.card-badge--right {
		right: -4px;
	}

	.card-member {
		margin-top: 10px;
		font-size: 18px;
		font-weight: 800;
	}

	.card-eng {
		margin-top: 2px;
		font-size: 11px;
		opacity: 0.8;
		letter-spacing: 0.02em;
	}

	.card-divider {
		margin: 16px -20px;
		border-top: 2px dashed rgba(255, 255, 255, 0.4);
	}

	.card-status {
		position: relative;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}

	.card-pill {
		background: rgba(255, 255, 255, 0.22);
		border-radius: var(--radius-sm);
		padding: 10px;
		text-align: center;
	}

	.card-pill.inactive {
		opacity: 0.6;
	}

	.pill-label {
		display: block;
		font-size: 11px;
		opacity: 0.85;
	}

	.card-pill strong {
		display: block;
		margin-top: 2px;
		font-size: 15px;
		font-weight: 800;
	}

	.card-footer {
		position: relative;
		margin-top: 16px;
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 10px;
	}

	.card-footer-info {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
	}

	.card-qr-chip {
		flex-shrink: 0;
		background: #ffffff;
		padding: 6px;
		border-radius: 10px;
		line-height: 0;
	}

	.card-qr {
		width: 64px;
		height: 64px;
		display: block;
	}

	.card-footer-row {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		font-weight: 700;
	}

	.footer-icon-chip {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		padding: 4px;
		border-radius: 50%;
		background: var(--color-surface);
		flex-shrink: 0;
		overflow: hidden;
	}

	/* object-fit: contain (rather than a fixed px size) keeps every icon
	   centered and evenly inset regardless of how much padding each
	   source SVG's own artwork already has within its viewBox — chzzk.svg
	   in particular draws edge-to-edge, so a fixed size made it look
	   larger and off-balance next to the others. */
	.footer-icon-chip img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		display: block;
	}

	.card-id {
		font-family: monospace;
		font-weight: 600;
		opacity: 0.9;
	}

	.verify-note {
		margin-top: 0;
		font-size: 11px;
		line-height: 1.5;
		color: var(--color-text-muted);
		text-align: center;
	}

	@keyframes card-pop {
		0% {
			opacity: 0;
			transform: scale(0.92);
		}
		60% {
			opacity: 1;
			transform: scale(1.02);
		}
		100% {
			transform: scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.card-frame {
			animation: none !important;
			opacity: 1;
		}
	}
</style>
