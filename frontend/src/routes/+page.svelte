<script lang="ts">
	import { onMount } from 'svelte';
	import { stellars } from '$lib/data/stellars';
	import type { ChzzkUser, StreamerInfo } from '$lib/types';
	import { PUBLIC_SERVER_URL } from '$env/static/public';
	import LoginScreen from '$lib/components/LoginScreen.svelte';
	import StellarGrid from '$lib/components/StellarGrid.svelte';
	import InfoDetail from '$lib/components/InfoDetail.svelte';

	type Screen = 'login' | 'select' | 'detail';

	let screen = $state<Screen>('login');
	let user = $state<ChzzkUser | null>(null);
	let selectedId = $state<string | null>(null);
	let loadingId = $state<string | null>(null);
	let info = $state<StreamerInfo | null>(null);

	let selectedStellar = $derived(stellars.find((s) => s.id === selectedId) ?? null);

	onMount(async () => {
		const res = await fetch(`${PUBLIC_SERVER_URL}/me`, { credentials: 'include' });
		if (res.ok) {
			user = await res.json();
			screen = 'select';
		}
	});

	async function selectStellar(id: string) {
		loadingId = id;
		selectedId = id;
		const res = await fetch(`${PUBLIC_SERVER_URL}/streamer-info/${id}`, { credentials: 'include' });
		info = res.ok ? await res.json() : null;
		loadingId = null;
		screen = 'detail';
	}

	function backToGrid() {
		screen = 'select';
		info = null;
		selectedId = null;
	}

	async function handleLogout() {
		await fetch(`${PUBLIC_SERVER_URL}/logout`, { method: 'POST', credentials: 'include' });
		screen = 'login';
		user = null;
		selectedId = null;
		loadingId = null;
		info = null;
	}
</script>

<main class="app-shell">
	{#if screen === 'login'}
		<LoginScreen />
	{:else if screen === 'select' && user}
		<StellarGrid {stellars} {user} onSelect={selectStellar} onLogout={handleLogout} {loadingId} />
	{:else if screen === 'detail' && info && selectedStellar && user}
		<InfoDetail
			{info}
			image={selectedStellar.image}
			links={selectedStellar.links}
			stellarId={selectedStellar.id}
			{user}
			onBack={backToGrid}
		/>
	{/if}
</main>
