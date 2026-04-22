<script lang="ts">
	let { children } = $props();
</script>

<main class="bg-muted/40 flex min-h-screen items-center justify-center px-4 py-8">
	<div class="bg-card w-full max-w-lg rounded-3xl border p-8 shadow-sm">
		<div class="mb-8 flex items-center justify-center gap-4">
			<div class="bg-border h-px flex-1"></div>
			<div class="text-xl font-bold tracking-wider uppercase">Work It</div>
			<div class="bg-border h-px flex-1"></div>
		</div>
		{@render children()}
	</div>
</main>
