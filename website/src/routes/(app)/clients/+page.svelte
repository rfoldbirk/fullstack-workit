<script lang="ts">
	import { onMount } from 'svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import Activity from '@lucide/svelte/icons/activity';
	import UserRoundX from '@lucide/svelte/icons/user-round-x';
	import Users from '@lucide/svelte/icons/users';
	import type { ClientsResponse } from '$lib/api/types';

	let data: { status: 'ok'; data: ClientsResponse } | { status: 'forbidden' } | null = $state(null);
	let loading = $state(true);
	let error = $state('');

	onMount(async () => {
		try {
			const response = await fetch('/api/coach/clients', {
				credentials: 'include',
			});
			if (response.status === 403) {
				data = { status: 'forbidden' };
				return;
			}
			if (!response.ok) {
				throw new Error(await readErrorMessage(response, 'Failed to load clients'));
			}
			data = { status: 'ok', data: (await response.json()) as ClientsResponse };
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load clients';
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

	function formatActivity(value: string | null): string {
		if (!value) return 'No activity yet';
		return new Date(value).toLocaleDateString();
	}
</script>

<div class="flex flex-col gap-6">
	{#if loading}
		<div class="py-8 text-center">
			<p class="text-muted-foreground">Loading clients...</p>
		</div>
	{:else if error}
		<div class="py-8 text-center">
			<p class="text-destructive">{error}</p>
		</div>
	{:else if data?.status === 'forbidden'}
		<div
			class="border-border flex flex-col items-center gap-4 rounded-lg border border-dashed p-12 text-center"
		>
			<UserRoundX class="text-muted-foreground size-12" />
			<div>
				<h1 class="text-lg font-semibold">You are not a coach yet</h1>
				<p class="text-muted-foreground mt-1 max-w-md text-sm">
					Client workload is only visible for users registered as coaches.
				</p>
			</div>
		</div>
	{:else if data?.status === 'ok'}
		<div>
			<h1 class="text-3xl font-semibold tracking-tight">Clients</h1>
			<p class="text-muted-foreground">
				{data.data.summary.clientCount} client{data.data.summary.clientCount === 1 ? '' : 's'}{data
					.data.summary.maxClients !== null
					? ` of ${data.data.summary.maxClients}`
					: ''}.
			</p>
		</div>

		{#if data.data.clients.length === 0}
			<div
				class="border-border flex flex-col items-center gap-4 rounded-lg border border-dashed p-12 text-center"
			>
				<Users class="text-muted-foreground size-12" />
				<div>
					<h2 class="text-lg font-semibold">No connected clients</h2>
					<p class="text-muted-foreground mt-1 max-w-md text-sm">
						Clients who connect to you from the Coach page will appear here.
					</p>
				</div>
			</div>
		{:else}
			<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{#each data.data.clients as client (client.id)}
					<Card.Root>
						<Card.Header>
							<Card.Title>{client.name}</Card.Title>
							<Card.Description>{client.email}</Card.Description>
						</Card.Header>
						<Card.Content class="flex flex-col gap-4">
							<div class="grid grid-cols-2 gap-3 text-sm">
								<div>
									<div class="text-muted-foreground text-xs">Programs</div>
									<div class="font-medium">{client.assignedProgramCount}</div>
								</div>
								<div>
									<div class="text-muted-foreground text-xs">Completed</div>
									<div class="font-medium">{client.completedWorkouts}</div>
								</div>
								<div>
									<div class="text-muted-foreground text-xs">Weight logs</div>
									<div class="font-medium">{client.weightLogCount}</div>
								</div>
								<div>
									<div class="text-muted-foreground text-xs">Last activity</div>
									<div class="font-medium">{formatActivity(client.latestActivityAt)}</div>
								</div>
							</div>

							<div class="border-border border-t pt-3 text-sm">
								<div class="mb-2 flex items-center gap-2 font-medium">
									<Activity class="size-4" />
									Workload
								</div>
								<div class="grid gap-2">
									{#if client.currentWeightKg !== null}
										<div class="flex justify-between">
											<span class="text-muted-foreground">Current weight</span>
											<span>{client.currentWeightKg} kg</span>
										</div>
									{/if}
									{#if client.heightCm !== null}
										<div class="flex justify-between">
											<span class="text-muted-foreground">Height</span>
											<span>{client.heightCm} cm</span>
										</div>
									{/if}
									{#if client.latestProgram}
										<div>
											<div class="text-muted-foreground text-xs">Latest assigned program</div>
											<div class="font-medium">{client.latestProgram.title}</div>
											<div class="text-muted-foreground text-xs">
												{client.latestProgram.description}
											</div>
										</div>
									{:else}
										<p class="text-muted-foreground text-sm">No assigned program yet.</p>
									{/if}
								</div>
							</div>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		{/if}
	{/if}
</div>
