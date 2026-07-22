<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { stellars } from '$lib/data/stellars';
	import { auth } from '$lib/state/auth.svelte';
	import { fetchStreamerInfo, getCachedStreamerInfo } from '$lib/state/streamerInfoCache';
	import type { StreamerInfo } from '$lib/types';
	import InfoDetail from '$lib/components/InfoDetail.svelte';

	// SvelteKit always populates a matched [id] segment at runtime; the `?? ''`
	// only satisfies $app/state's generic (route-agnostic) params typing.
	let stellarId = $derived(page.params.id ?? '');
	let stellar = $derived(stellars.find((s) => s.id === stellarId) ?? null);
	let info = $state<StreamerInfo | null>(null);

	$effect(() => {
		if (auth.checked && !auth.user) goto('/');
	});

	$effect(() => {
		if (!stellar) return;
		// Already fetched (and its tile spinner shown) on the select screen
		// before navigating here — only hits the network if this page was
		// reached directly (refresh, shared link).
		// Uses a local const rather than reading `info` back after writing
		// it: reading a $state right after writing it inside the same
		// effect makes the effect depend on itself, causing an infinite
		// update loop.
		const cached = getCachedStreamerInfo(stellarId);
		if (cached) {
			info = cached;
			return;
		}
		fetchStreamerInfo(stellarId).then((data) => (info = data));
	});

	function backToGrid() {
		goto('/select');
	}
</script>

{#if !stellar}
	<p class="status-text">존재하지 않는 스텔라예요.</p>
{:else if auth.user && info}
	<InfoDetail {info} image={stellar.image} links={stellar.links} {stellarId} user={auth.user} onBack={backToGrid} />
{:else if auth.user}
	<p class="status-text">불러오는 중...</p>
{/if}

<style>
	.status-text {
		margin-top: 40px;
		text-align: center;
		color: var(--color-text-muted);
		font-size: 14px;
	}
</style>
