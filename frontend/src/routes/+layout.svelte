<script lang="ts">
	import '../app.css';
	import { pwaInfo } from 'virtual:pwa-info';

	let { children } = $props();

	let webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');
</script>

<svelte:head>
	<link rel="icon" type="image/png" href="/icons/icon.png" />
	<link rel="apple-touch-icon" href="/icons/icon.png" />
	{@html webManifestLink}
</svelte:head>

{@render children()}
