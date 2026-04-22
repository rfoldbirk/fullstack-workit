<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(async () => {
		try {
			await fetch('/api/auth/logout', {
				method: 'POST',
				credentials: 'include',
			});
		} finally {
			goto('/signin', { replaceState: true });
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center">
	<p class="text-muted-foreground text-sm">Signing out...</p>
</div>
