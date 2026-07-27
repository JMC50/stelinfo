<script lang="ts">
	import { goto } from '$app/navigation';
	import { stellars } from '$lib/data/stellars';
	import QrScanModal from '$lib/components/QrScanModal.svelte';
	import { auth } from '$lib/state/auth.svelte';
	import { verifyBatch } from '$lib/state/shareApi';
	import type { VerifyResult } from '$lib/types';

	let selectedStellarId = $state('');
	let minFollowDays = $state('');
	let minSubscribeMonths = $state('');
	let idsText = $state('');
	let results = $state<VerifyResult[] | null>(null);
	let checking = $state(false);
	let errorMessage = $state('');
	let scannerOpen = $state(false);

	let summary = $derived.by(() => {
		if (!results) return null;
		let pass = 0;
		let fail = 0;
		let missing = 0;
		for (const r of results) {
			if (!r.found) missing++;
			else if (r.meetsCondition) pass++;
			else fail++;
		}
		return { total: results.length, pass, fail, missing };
	});

	$effect(() => {
		if (auth.checked && !auth.user) goto('/');
	});

	async function handleCheck() {
		const ids = idsText
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line.length > 0);

		if (ids.length === 0) {
			errorMessage = '확인할 인증ID를 한 줄에 하나씩 입력해주세요.';
			return;
		}

		checking = true;
		errorMessage = '';
		try {
			results = await verifyBatch(
				ids,
				minFollowDays ? Number(minFollowDays) : null,
				minSubscribeMonths ? Number(minSubscribeMonths) : null,
				selectedStellarId || null
			);
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : '조회에 실패했어요.';
		} finally {
			checking = false;
		}
	}

	function handleQrScan(id: string) {
		const lines = idsText
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line.length > 0);
		if (lines.includes(id)) return;
		idsText = lines.length > 0 ? `${lines.join('\n')}\n${id}` : id;
	}
</script>

<section class="verify-page">
	<div class="verify-inner">
		<header class="page-header">
			<button class="back-btn" onclick={() => goto('/select')} aria-label="목록으로 돌아가기">
				<span aria-hidden="true">←</span> 목록으로
			</button>
			<h1>인증 확인</h1>
			<p class="page-desc">참가자들이 공유한 인증ID를 붙여넣고, 원하는 조건에 맞는지 한 번에 확인하세요.</p>
		</header>

		<div class="condition-card">
			<div class="condition-top">
				<div class="condition-row">
					<label for="stellarSelect">대상 스텔라</label>
					<select id="stellarSelect" bind:value={selectedStellarId}>
						<option value="">전체 (선택 안 함)</option>
						{#each stellars as s (s.id)}
							<option value={s.id}>{s.korName}</option>
						{/each}
					</select>
				</div>
				<div class="condition-row">
					<label for="minFollowDays">최소 팔로우 일수</label>
					<input id="minFollowDays" type="number" min="0" placeholder="예: 90" bind:value={minFollowDays} />
				</div>
				<div class="condition-row">
					<label for="minSubscribeMonths">최소 구독 개월</label>
					<input
						id="minSubscribeMonths"
						type="number"
						min="0"
						placeholder="예: 3"
						bind:value={minSubscribeMonths}
					/>
				</div>
			</div>

			<div class="ids-block">
				<div class="ids-label-row">
					<label for="idsText" class="ids-label">인증ID (한 줄에 하나씩)</label>
					<button type="button" class="qr-btn" onclick={() => (scannerOpen = true)}>
						<span aria-hidden="true">📷</span> QR 인식
					</button>
				</div>
				<textarea id="idsText" rows="6" placeholder={'AB3XY9ZK\nCD8PL2WR'} bind:value={idsText}
				></textarea>
			</div>

			{#if errorMessage}<p class="error-text">{errorMessage}</p>{/if}

			<button class="check-btn" onclick={handleCheck} disabled={checking}>
				{checking ? '확인하는 중...' : '조건 확인하기'}
			</button>
		</div>

		{#if summary}
			<div class="summary-row">
				<div class="summary-chip">
					<strong>{summary.total}</strong>
					<span>전체</span>
				</div>
				<div class="summary-chip summary-chip--pass">
					<strong>{summary.pass}</strong>
					<span>충족</span>
				</div>
				<div class="summary-chip summary-chip--fail">
					<strong>{summary.fail}</strong>
					<span>미충족</span>
				</div>
				<div class="summary-chip summary-chip--missing">
					<strong>{summary.missing}</strong>
					<span>확인불가</span>
				</div>
			</div>

			<div class="results-wrap">
				<table class="results-table">
					<thead>
						<tr>
							<th>인증ID</th>
							<th>스텔라</th>
							<th>X ID</th>
							<th>실제 닉네임</th>
							<th>팔로우</th>
							<th>구독</th>
							<th>결과</th>
						</tr>
					</thead>
					<tbody>
						{#each results as r, i (r.id)}
							<tr
								class:fail={r.found && !r.meetsCondition}
								class:not-found={!r.found}
								style={`animation-delay:${Math.min(i, 20) * 30}ms`}
							>
								<td class="mono">{r.id}</td>
								{#if r.found}
									<td>{r.memberName}</td>
									<td>@{r.claimedHandle}</td>
									<td>{r.channelName}</td>
									<td>{r.followDays}일</td>
									<td>{r.subscribeMonth}개월</td>
									<td>
										<span
											class="badge"
											class:badge--pass={r.meetsCondition}
											class:badge--fail={!r.meetsCondition}
										>
											{r.meetsCondition ? '충족' : r.stellarMismatch ? '다른 스텔라' : '미충족'}
										</span>
									</td>
								{:else}
									<td colspan="6">존재하지 않거나 취소된 인증ID예요.</td>
								{/if}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>

	{#if scannerOpen}
		<QrScanModal onScan={handleQrScan} onClose={() => (scannerOpen = false)} />
	{/if}
</section>

<style>
	.verify-page {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.verify-inner {
		flex: 1;
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	.condition-top {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.page-header {
		opacity: 0;
		animation: fade-up 0.3s ease-out both;
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

	.condition-card {
		margin-top: 20px;
		background: var(--color-surface);
		border-radius: var(--radius-md);
		padding: 18px;
		box-shadow: 0 4px 12px rgba(134, 127, 219, 0.12);
		display: flex;
		flex-direction: column;
		gap: 12px;
		opacity: 0;
		animation: fade-up 0.3s ease-out 0.06s both;
	}

	.condition-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}

	.condition-row label {
		font-size: 13px;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.condition-row input {
		width: 100px;
		border: 1px solid var(--color-bg-soft);
		border-radius: var(--radius-sm);
		padding: 8px 10px;
		font-size: 14px;
		text-align: right;
	}

	.condition-row select {
		border: 1px solid var(--color-bg-soft);
		border-radius: var(--radius-sm);
		padding: 8px 10px;
		font-size: 14px;
		background: var(--color-surface);
		color: var(--color-text);
		max-width: 60%;
	}

	.ids-block {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.ids-label-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.ids-label {
		font-size: 13px;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.qr-btn {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		border: none;
		background: var(--color-bg-soft);
		color: var(--color-primary);
		font-size: 12px;
		font-weight: 700;
		padding: 6px 10px;
		border-radius: 999px;
		cursor: pointer;
	}

	textarea {
		border: 1px solid var(--color-bg-soft);
		border-radius: var(--radius-sm);
		padding: 10px 12px;
		font-size: 13px;
		font-family: monospace;
		resize: vertical;
	}

	.error-text {
		font-size: 13px;
		color: #d64545;
	}

	.check-btn {
		border: none;
		border-radius: var(--radius-sm);
		padding: 13px;
		background: var(--color-primary);
		color: #fff;
		font-size: 15px;
		font-weight: 700;
		cursor: pointer;
	}

	.check-btn:disabled {
		opacity: 0.7;
		cursor: default;
	}

	.check-btn:active {
		transform: scale(0.98);
	}

	.summary-row {
		margin-top: 18px;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;
		opacity: 0;
		animation: fade-up 0.3s ease-out both;
	}

	.summary-chip {
		background: var(--color-surface);
		border-radius: var(--radius-sm);
		padding: 10px 6px;
		text-align: center;
		box-shadow: 0 4px 10px rgba(134, 127, 219, 0.1);
	}

	.summary-chip strong {
		display: block;
		font-size: 17px;
		font-weight: 800;
	}

	.summary-chip span {
		font-size: 10px;
		color: var(--color-text-muted);
		font-weight: 600;
	}

	.summary-chip--pass strong {
		color: #1f9d5a;
	}

	.summary-chip--fail strong {
		color: #d64545;
	}

	.summary-chip--missing strong {
		color: var(--color-text-muted);
	}

	.results-wrap {
		margin-top: 12px;
		overflow-x: auto;
		background: var(--color-surface);
		border-radius: var(--radius-md);
		box-shadow: 0 4px 12px rgba(134, 127, 219, 0.12);
		opacity: 0;
		animation: fade-up 0.3s ease-out 0.05s both;
	}

	.results-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 12px;
		white-space: nowrap;
	}

	.results-table th,
	.results-table td {
		padding: 10px 12px;
		text-align: left;
		border-bottom: 1px solid var(--color-bg-soft);
	}

	.results-table tbody tr {
		opacity: 0;
		animation: row-in 0.25s ease-out both;
	}

	.results-table tr.fail {
		background: rgba(214, 69, 69, 0.06);
	}

	.results-table tr.not-found {
		background: rgba(111, 111, 136, 0.08);
		color: var(--color-text-muted);
	}

	.mono {
		font-family: monospace;
	}

	.badge {
		display: inline-block;
		padding: 3px 9px;
		border-radius: 999px;
		font-size: 11px;
		font-weight: 700;
	}

	.badge--pass {
		background: rgba(31, 157, 90, 0.14);
		color: #1f9d5a;
	}

	.badge--fail {
		background: rgba(214, 69, 69, 0.12);
		color: #d64545;
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

	@keyframes row-in {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.page-header,
		.condition-card,
		.summary-row,
		.results-wrap,
		.results-table tbody tr {
			animation: none !important;
			opacity: 1;
		}
	}

	/* PC/tablet: same full-bleed break-out as the other screens, but wide
	   enough that the results table's seven columns fit without needing
	   the horizontal scroll it falls back to on mobile. */
	@media (min-width: 768px) {
		.verify-page {
			width: 100vw;
			margin-left: calc(50% - 50vw);
		}

		.verify-inner {
			max-width: 960px;
			margin: 0 auto;
			padding: 0 40px;
		}

		.page-header h1 {
			font-size: 26px;
		}

		.page-desc {
			font-size: 14px;
		}

		/* Each condition becomes a label-over-input column instead of a
		   label/value pair, laid out side by side — reads more like a
		   normal desktop form than three stacked mobile rows. */
		.condition-top {
			flex-direction: row;
			gap: 20px;
		}

		.condition-row {
			flex: 1;
			flex-direction: column;
			align-items: flex-start;
			gap: 6px;
		}

		.condition-row input,
		.condition-row select {
			width: 100%;
			text-align: left;
		}

		.check-btn {
			align-self: flex-start;
			padding-left: 32px;
			padding-right: 32px;
		}

		.results-table {
			white-space: normal;
		}
	}
</style>
