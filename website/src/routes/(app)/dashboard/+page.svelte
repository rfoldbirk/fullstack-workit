<script lang="ts">
	import { onMount } from 'svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import type { MeResponse } from '$lib/api/types';

	let meResponse: MeResponse | null = $state(null);
	let loading = $state(true);
	let error = $state('');

	onMount(async () => {
		try {
			const response = await fetch('/api/me', {
				credentials: 'include',
			});
			if (!response.ok) {
				throw new Error(await readErrorMessage(response, 'Failed to load dashboard'));
			}
			meResponse = (await response.json()) as MeResponse;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load dashboard';
		} finally {
			loading = false;
		}
	});

	async function readErrorMessage(response: Response, fallback: string): Promise<string> {
		try {
			const payload = (await response.json()) as {
				error?: string | { message?: string };
			};
			const error = payload.error;
			return typeof error === 'string' ? error : (error?.message ?? fallback);
		} catch {
			return fallback;
		}
	}
</script>

<div class="flex flex-col gap-6">
	{#if loading}
		<div class="text-center py-8">
			<p class="text-muted-foreground">Loading...</p>
		</div>
	{:else if error}
		<div class="text-center py-8">
			<p class="text-destructive">{error}</p>
		</div>
	{:else if meResponse}
		<div>
			<h1 class="text-3xl font-semibold tracking-tight">Welcome back, {meResponse.name}</h1>
			<p class="text-muted-foreground">Here's a quick look at what's happening.</p>
		</div>

		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<Card.Root>
				<Card.Header>
					<Card.Title>Current weight</Card.Title>
					<Card.Description>Your latest logged weight.</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-semibold">
						{meResponse.weight_kg !== null ? `${meResponse.weight_kg} kg` : '—'}
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>Coach</Card.Title>
					<Card.Description>Your connected coach.</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="text-lg font-medium">Not connected</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>Workouts</Card.Title>
					<Card.Description>Your training plans.</Card.Description>
				</Card.Header>
				<Card.Content>
					<a href="/workouts" class="text-sm font-medium underline-offset-4 hover:underline">
						Manage programs →
					</a>
				</Card.Content>
			</Card.Root>
		</div>
	{/if}
</div>
