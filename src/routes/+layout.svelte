<script lang="ts">
	import favicon from '$lib/assets/favicon.svg'
	import '../app.css';
	let { children } = $props();
</script>

<svelte:head>
	<title>Spur Support Agent</title>
	<meta name="description" content="AI Customer Support Agent built for Spur" />
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Svelte 5 way to render the child page -->
{@render children()}

<style>
	:global(body) {
		font-family: 'Inter', sans-serif;
	}
</style>