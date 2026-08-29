<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import { pwaInfo } from 'virtual:pwa-info';
	import { useRegisterSW } from 'virtual:pwa-register/svelte';
	import { auth } from '$lib/state/auth.svelte';
	import { dev } from '$app/environment';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';

	injectAnalytics({ mode: dev ? 'development' : 'production' });

	let { children } = $props();

	let webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');

	onMount(() => {
		auth.check();
		// pwaInfo only supplies the manifest link tag -- the service worker
		// itself (needed for push notifications, not just offline support)
		// is never registered unless this is called explicitly.
		useRegisterSW({ immediate: true });
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
