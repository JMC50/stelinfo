<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/state/auth.svelte';
	import LoginScreen from '$lib/components/LoginScreen.svelte';

	$effect(() => {
		if (auth.checked && auth.user) goto('/select');
	});
</script>

{#if !auth.checked || !auth.user}
	<LoginScreen />
{/if}
