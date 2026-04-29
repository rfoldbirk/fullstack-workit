<script lang="ts">
  import { onMount } from 'svelte';
  import Activity from '@lucide/svelte/icons/activity';
  import BadgeInfo from '@lucide/svelte/icons/badge-info';
  import GraduationCap from '@lucide/svelte/icons/graduation-cap';
  import UserRoundX from '@lucide/svelte/icons/user-round-x';
  import Users from '@lucide/svelte/icons/users';
  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import type {
    ClientsResponse,
    CoachProfileResponse,
    MeResponse,
  } from '$lib/api/types';

  let meResponse: MeResponse | null = $state(null);
  let coachStatus: CoachProfileResponse | null = $state(null);
  let clientsData: ClientsResponse | null = $state(null);
  let loading = $state(true);
  let error = $state('');

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    try {
      loading = true;
      error = '';

      const [me, coach] = await Promise.all([
        fetchJson<MeResponse>('/api/me', 'Failed to load clients page'),
        fetchJson<CoachProfileResponse>('/api/me/coach', 'Failed to load clients page'),
      ]);

      meResponse = me;
      coachStatus = coach;

      if (coach.myCoachProfile) {
        clientsData = await fetchJson<ClientsResponse>(
          '/api/coach/clients',
          'Failed to load your clients',
        );
      } else {
        clientsData = null;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load clients page';
    } finally {
      loading = false;
    }
  }

  function initials(name: string): string {
    return name
      .split(/\s+/)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .slice(0, 2)
      .join('');
  }

  function formatActivity(value: string | null): string {
    return value ? new Date(value).toLocaleDateString() : 'No activity yet';
  }

  async function fetchJson<T>(
    url: string,
    fallback: string,
    init?: RequestInit,
  ): Promise<T> {
    const response = await fetch(url, {
      ...init,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, fallback));
    }

    if (response.status === 204) {
      return null as T;
    }

    return (await response.json()) as T;
  }

  async function readErrorMessage(response: Response, fallback: string): Promise<string> {
    try {
      const payload = (await response.json()) as {
        error?: string | { message?: string };
      };
      const error = payload.error;
      return typeof error === 'string' ? error : error?.message ?? fallback;
    } catch {
      return fallback;
    }
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
  {:else}
    <div>
      <h1 class="text-3xl font-semibold tracking-tight">Clients</h1>
      <p class="text-muted-foreground">
        See the users currently attached to your coach roster.
      </p>
    </div>

    {#if coachStatus?.myCoachProfile && clientsData}
      <div class="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <Card.Root>
          <Card.Header>
            <Card.Title class="flex items-center gap-2">
              <GraduationCap class="size-5" />
              Roster summary
            </Card.Title>
            <Card.Description>
              A quick overview of your current coaching capacity.
            </Card.Description>
          </Card.Header>
          <Card.Content class="grid gap-4 sm:grid-cols-3">
            <div>
              <div class="text-muted-foreground text-xs uppercase">Clients</div>
              <div class="text-2xl font-semibold">
                {clientsData.summary.clientCount}
              </div>
            </div>
            <div>
              <div class="text-muted-foreground text-xs uppercase">Capacity</div>
              <div class="text-2xl font-semibold">
                {clientsData.summary.maxClients ?? 'Unlimited'}
              </div>
            </div>
            <div>
              <div class="text-muted-foreground text-xs uppercase">Open slots</div>
              <div class="text-2xl font-semibold">
                {clientsData.summary.maxClients === null
                  ? 'Unlimited'
                  : clientsData.summary.maxClients - clientsData.summary.clientCount}
              </div>
            </div>
          </Card.Content>
        </Card.Root>

        <Card.Root>
          <Card.Header>
            <Card.Title>Your client list</Card.Title>
            <Card.Description>
              Every user currently connected to you as their coach.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            {#if clientsData.clients.length === 0}
              <div class="border-border bg-muted/20 rounded-lg border p-6 text-sm">
                <div class="mb-2 flex items-center gap-2 font-medium">
                  <Users class="size-4" />
                  No clients yet
                </div>
                <p class="text-muted-foreground">
                  When users join your roster from the Coach page, they will appear here.
                </p>
              </div>
            {:else}
              <div class="grid gap-4 md:grid-cols-2">
                {#each clientsData.clients as client (client.id)}
                  <Card.Root size="sm">
                    <Card.Header>
                      <div class="flex items-start gap-3">
                        <Avatar.Root class="size-11 rounded-lg">
                          {#if client.picture}
                            <Avatar.Image src={client.picture} alt={client.name} />
                          {/if}
                          <Avatar.Fallback class="rounded-lg">
                            {initials(client.name) || 'C'}
                          </Avatar.Fallback>
                        </Avatar.Root>

                        <div class="min-w-0 flex-1">
                          <Card.Title class="truncate">{client.name}</Card.Title>
                          <Card.Description>{client.email}</Card.Description>
                        </div>
                      </div>
                    </Card.Header>

                    <Card.Content class="flex flex-col gap-4">
                      <div class="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div class="text-muted-foreground text-xs">Age</div>
                          <div class="font-medium">{client.age ?? '—'}</div>
                        </div>
                        <div>
                          <div class="text-muted-foreground text-xs">Weight</div>
                          <div class="font-medium">
                            {client.currentWeightKg !== null ? `${client.currentWeightKg} kg` : '—'}
                          </div>
                        </div>
                        <div>
                          <div class="text-muted-foreground text-xs">Programs</div>
                          <div class="font-medium">{client.assignedProgramCount}</div>
                        </div>
                        <div>
                          <div class="text-muted-foreground text-xs">Weight logs</div>
                          <div class="font-medium">{client.weightLogCount}</div>
                        </div>
                      </div>

                      <div class="border-border border-t pt-3 text-sm">
                        <div class="mb-2 flex items-center gap-2 font-medium">
                          <Activity class="size-4" />
                          Activity
                        </div>

                        <div class="grid gap-2">
                          <div class="flex justify-between gap-3">
                            <span class="text-muted-foreground">Last activity</span>
                            <span>{formatActivity(client.latestActivityAt)}</span>
                          </div>

                          <div class="flex justify-between gap-3">
                            <span class="text-muted-foreground">Completed workouts</span>
                            <span>{client.completedWorkouts}</span>
                          </div>

                          {#if client.latestProgram}
                            <div class="pt-1">
                              <div class="text-muted-foreground text-xs">Latest assigned program</div>
                              <div class="font-medium">{client.latestProgram.title}</div>
                              {#if client.latestProgram.description}
                                <div class="text-muted-foreground text-xs">
                                  {client.latestProgram.description}
                                </div>
                              {/if}
                            </div>
                          {:else}
                            <p class="text-muted-foreground text-sm">
                              No assigned program yet.
                            </p>
                          {/if}
                        </div>
                      </div>
                    </Card.Content>
                  </Card.Root>
                {/each}
              </div>
            {/if}
          </Card.Content>
        </Card.Root>
      </div>
    {:else if coachStatus?.connectedCoach}
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <UserRoundX class="size-5" />
            You are not a coach
          </Card.Title>
          <Card.Description>
            This page shows the clients attached to your own coach roster.
          </Card.Description>
        </Card.Header>
        <Card.Content class="flex flex-col gap-4">
          <div class="border-border bg-muted/20 rounded-lg border p-4 text-sm">
            <div class="mb-2 flex items-center gap-2 font-medium">
              <BadgeInfo class="size-4" />
              Current status
            </div>
            <p class="text-muted-foreground">
              You are currently attached to {coachStatus.connectedCoach.users.name} as a client. To see your own clients here, you need an active coach profile.
            </p>
          </div>

          <Button href="/profile" variant="outline" class="self-start">
            Open profile
          </Button>
        </Card.Content>
      </Card.Root>
    {:else}
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <UserRoundX class="size-5" />
            No coach profile
          </Card.Title>
          <Card.Description>
            Create a coach profile before you can have clients attached to you.
          </Card.Description>
        </Card.Header>
        <Card.Content class="flex flex-col gap-4">
          <div class="border-border bg-muted/20 rounded-lg border p-4 text-sm">
            <div class="mb-2 flex items-center gap-2 font-medium">
              <BadgeInfo class="size-4" />
              Next step
            </div>
            <p class="text-muted-foreground">
              Open your profile, become a coach, and users will be able to join your roster from the Coach page.
            </p>
          </div>

          <Button href="/profile" class="self-start">Become a coach</Button>
        </Card.Content>
      </Card.Root>
    {/if}
  {/if}
</div>
