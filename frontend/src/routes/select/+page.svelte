<script lang="ts">
	import { goto } from '$app/navigation';
	import { stellars } from '$lib/data/stellars';
	import { auth } from '$lib/state/auth.svelte';
	import { fetchStreamerInfo } from '$lib/state/streamerInfoCache';
	import StellarGrid from '$lib/components/StellarGrid.svelte';

	let loadingId = $state<string | null>(null);

	$effect(() => {
		if (auth.checked && !auth.user) goto('/');
	});

	async function selectStellar(id: string) {
		loadingId = id;
		try {
			await fetchStreamerInfo(id);
			await goto(`/stellar/${id}`);
		} finally {
			loadingId = null;
		}
	}

	async function handleLogout() {
		await auth.logout();
		goto('/');
	}
</script>

{#if auth.user}
	<StellarGrid {stellars} user={auth.user} onSelect={selectStellar} onLogout={handleLogout} {loadingId} />
{/if}
