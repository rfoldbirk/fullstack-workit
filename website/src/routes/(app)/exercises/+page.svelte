<script lang="ts">
	import BicepsFlexed from '@lucide/svelte/icons/biceps-flexed';
</script>

<div class="flex flex-col gap-6">
	<div>
		<h1 class="text-3xl font-semibold tracking-tight">Exercises</h1>
		<p class="text-muted-foreground">The exercise catalog is coming soon.</p>
	</div>

	<div
		class="border-border flex flex-col items-center gap-4 rounded-lg border border-dashed p-12 text-center"
	>
		<BicepsFlexed class="text-muted-foreground size-12" />
		<div>
			<h2 class="text-lg font-semibold">Exercise catalog placeholder</h2>
			<p class="text-muted-foreground mt-1 max-w-md text-sm">
				This page is ready for the exercise list once the exercise API is available.
			</p>
		</div>
	</div>
</div>
