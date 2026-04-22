<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Dumbbell from '@lucide/svelte/icons/dumbbell';
</script>

<div class="flex flex-col gap-6">
	<div>
		<a
			href="/workouts"
			class="text-muted-foreground hover:text-foreground mb-1 inline-flex items-center gap-1 text-xs"
		>
			<ArrowLeft class="size-3" />
			All programs
		</a>
		<h1 class="text-3xl font-semibold tracking-tight">Program</h1>
		<p class="text-muted-foreground">Program details are coming soon.</p>
	</div>

	<div
		class="border-border flex flex-col items-center gap-4 rounded-lg border border-dashed p-12 text-center"
	>
		<Dumbbell class="text-muted-foreground size-12" />
		<div>
			<h2 class="text-lg font-semibold">Program detail placeholder</h2>
			<p class="text-muted-foreground mt-1 max-w-md text-sm">
				This page is ready for exercises and set logging once the programs API is available.
			</p>
		</div>
	</div>
</div>
