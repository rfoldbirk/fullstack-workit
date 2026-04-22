<script lang="ts">
	import { onMount } from 'svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { toast } from 'svelte-sonner';
	import Check from '@lucide/svelte/icons/check';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
	import type { CoachesResponse } from '$lib/api/types';

	let data: CoachesResponse | null = $state(null);
	let loading = $state(true);
	let error = $state('');
	let connectingCoachId: number | null = $state(null);

	onMount(async () => {
		await loadCoaches();
	});

	async function loadCoaches() {
		try {
			const response = await fetch('/api/coaches', {
				credentials: 'include',
			});
			if (!response.ok) {
				throw new Error(await readErrorMessage(response, 'Failed to load coaches'));
			}
			data = (await response.json()) as CoachesResponse;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load coaches';
		} finally {
			loading = false;
		}
	}

	async function connectToCoach(coachId: number) {
		connectingCoachId = coachId;

		try {
			const response = await fetch(`/api/coaches/${coachId}/connect`, {
				method: 'POST',
				credentials: 'include',
			});
			if (!response.ok) {
				throw new Error(await readErrorMessage(response, 'Failed to connect coach'));
			}
			toast.success('Coach connected');
			await loadCoaches();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to connect coach');
		} finally {
			connectingCoachId = null;
		}
	}

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

	function initials(name: string): string {
		return name
			.split(/\s+/)
			.map((part) => part[0]?.toUpperCase() ?? '')
			.slice(0, 2)
			.join('');
	}
</script>

<div class="flex flex-col gap-6">
	{#if loading}
		<div class="py-8 text-center">
			<p class="text-muted-foreground">Loading coaches...</p>
		</div>
	{:else if error}
		<div class="py-8 text-center">
			<p class="text-destructive">{error}</p>
		</div>
	{:else if data}
		<div>
			<h1 class="text-3xl font-semibold tracking-tight">Coach</h1>
			<p class="text-muted-foreground">
				{data.summary.totalCoaches} coach{data.summary.totalCoaches === 1 ? '' : 'es'} available.
			</p>
		</div>

		{#if data.coaches.length === 0}
			<div
				class="border-border flex flex-col items-center gap-4 rounded-lg border border-dashed p-12 text-center"
			>
				<GraduationCap class="text-muted-foreground size-12" />
				<div>
					<h2 class="text-lg font-semibold">No coaches yet</h2>
					<p class="text-muted-foreground mt-1 max-w-md text-sm">
						When coach profiles are added, clients can connect to them here.
					</p>
				</div>
			</div>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.coaches as coach (coach.id)}
					<Card.Root>
						<Card.Header>
							<div class="flex items-start gap-3">
								<Avatar.Root class="size-10 rounded-lg">
									{#if coach.picture}
										<Avatar.Image src={coach.picture} alt={coach.name} />
									{/if}
									<Avatar.Fallback class="rounded-lg">{initials(coach.name) || 'C'}</Avatar.Fallback>
								</Avatar.Root>
								<div class="min-w-0 flex-1">
									<Card.Title class="flex items-center gap-2">
										<span class="truncate">{coach.name}</span>
										{#if coach.isCurrentCoach}
											<span
												class="bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
											>
												<Check class="size-3" />
												Connected
											</span>
										{/if}
									</Card.Title>
									<Card.Description>{coach.email}</Card.Description>
								</div>
							</div>
						</Card.Header>
						<Card.Content class="flex flex-col gap-4">
							<div class="grid gap-2 text-sm">
								<div class="flex justify-between">
									<span class="text-muted-foreground">Price</span>
									<span class="font-medium">{coach.priceDkk} DKK</span>
								</div>
								<div class="flex justify-between">
									<span class="text-muted-foreground">Clients</span>
									<span>{coach.currentClients} / {coach.maxClients ?? 'unlimited'}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-muted-foreground">Open slots</span>
									<span>{coach.remainingSlots ?? 'unlimited'}</span>
								</div>
							</div>

							<Button
								variant={coach.isCurrentCoach ? 'outline' : 'default'}
								disabled={coach.isCurrentCoach || coach.remainingSlots === 0 || connectingCoachId !== null}
								onclick={() => connectToCoach(coach.id)}
							>
								{#if coach.isCurrentCoach}
									Connected
								{:else if connectingCoachId === coach.id}
									Connecting...
								{:else}
									Connect
								{/if}
							</Button>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		{/if}
	{/if}
</div>
