<script lang="ts">
	import { stellars } from '$lib/data/stellars';
	import { fetchStreamerInfo } from '$lib/data/dummy';
	import type { StreamerInfo } from '$lib/types';
	import LoginScreen from '$lib/components/LoginScreen.svelte';
	import StellarGrid from '$lib/components/StellarGrid.svelte';
	import InfoDetail from '$lib/components/InfoDetail.svelte';

	type Screen = 'login' | 'select' | 'detail';

	let screen = $state<Screen>('login');
	let selectedId = $state<string | null>(null);
	let loadingId = $state<string | null>(null);
	let info = $state<StreamerInfo | null>(null);

	let selectedStellar = $derived(stellars.find((s) => s.id === selectedId) ?? null);

	function handleLogin() {
		screen = 'select';
	}

	async function selectStellar(id: string) {
		loadingId = id;
		selectedId = id;
		info = await fetchStreamerInfo(id);
		loadingId = null;
		screen = 'detail';
	}

	function backToGrid() {
		screen = 'select';
		info = null;
		selectedId = null;
	}

	function handleLogout() {
		screen = 'login';
		selectedId = null;
		loadingId = null;
		info = null;
	}
</script>

<main class="app-shell">
	{#if screen === 'login'}
		<LoginScreen onLogin={handleLogin} />
	{:else if screen === 'select'}
		<StellarGrid {stellars} onSelect={selectStellar} onLogout={handleLogout} {loadingId} />
	{:else if screen === 'detail' && info && selectedStellar}
		<InfoDetail {info} image={selectedStellar.image} onBack={backToGrid} />
	{/if}
</main>
