<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import { pwaInfo } from 'virtual:pwa-info';
	import { auth } from '$lib/state/auth.svelte';

	let { children } = $props();

	let webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');

	onMount(() => {
		auth.check();
	});
</script>

<svelte:head>
	<link rel="icon" type="image/png" href="/icons/icon.png" />
	<link rel="apple-touch-icon" href="/icons/icon.png" />
	{@html webManifestLink}
</svelte:head>

<main class="app-shell">
	{@render children()}
</main>
