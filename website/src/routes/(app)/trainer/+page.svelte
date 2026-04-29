<script lang="ts">
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import BadgeInfo from '@lucide/svelte/icons/badge-info';
  import Check from '@lucide/svelte/icons/check';
  import GraduationCap from '@lucide/svelte/icons/graduation-cap';
  import Users from '@lucide/svelte/icons/users';
  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import type {
    CoachListItem,
    CoachProfileResponse,
    CoachesResponse,
    MeResponse,
  } from '$lib/api/types';

  let meResponse: MeResponse | null = $state(null);
  let coachDirectory: CoachesResponse | null = $state(null);
  let coachStatus: CoachProfileResponse | null = $state(null);
  let loading = $state(true);
  let error = $state('');
  let joiningCoachId: number | null = $state(null);
  let leavingCoach = $state(false);

  onMount(async () => {
    await loadData();
  });

  const availableCoaches = $derived.by(() => {
    const userId = meResponse?.id;

    if (userId === undefined || !coachDirectory) {
      return [] as (CoachListItem & { isCurrentCoach: boolean })[];
    }

    const currentCoachId = coachStatus?.connectedCoach?.user_id ?? null;

    return coachDirectory.coaches
      .filter((coach) => coach.id !== userId)
      .filter(
        (coach) =>
          coach.id === currentCoachId ||
          coach.remainingSlots === null ||
          coach.remainingSlots > 0,
      )
      .map((coach) => ({
        ...coach,
        isCurrentCoach: coach.id === currentCoachId,
      }));
  });

  async function loadData() {
    try {
      loading = true;
      error = '';

      const [me, coaches, status] = await Promise.all([
        fetchJson<MeResponse>('/api/me', 'Failed to load coach page'),
        fetchJson<CoachesResponse>('/api/coaches', 'Failed to load coaches'),
        fetchJson<CoachProfileResponse>('/api/me/coach', 'Failed to load coach status'),
      ]);

      meResponse = me;
      coachDirectory = coaches;
      coachStatus = status;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load coach page';
    } finally {
      loading = false;
    }
  }

  async function handleJoinCoach(coachId: number) {
    joiningCoachId = coachId;

    try {
      await fetchJson(`/api/me/coach/${coachId}`, 'Failed to join coach roster', {
        method: 'POST',
      });

      toast.success('Coach joined successfully');
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to join coach roster');
    } finally {
      joiningCoachId = null;
    }
  }

  async function handleLeaveCoach() {
    leavingCoach = true;

    try {
      await fetchJson('/api/me/coach', 'Failed to leave coach roster', {
        method: 'DELETE',
      });

      toast.success('You left the coach roster');
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to leave coach roster');
    } finally {
      leavingCoach = false;
    }
  }

  function initials(name: string): string {
    return name
      .split(/\s+/)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .slice(0, 2)
      .join('');
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
      <p class="text-muted-foreground">Loading coaches...</p>
    </div>
  {:else if error}
    <div class="py-8 text-center">
      <p class="text-destructive">{error}</p>
    </div>
  {:else}
    <div>
      <h1 class="text-3xl font-semibold tracking-tight">Coach</h1>
      <p class="text-muted-foreground">
        Browse coaches with available spots and join the roster that fits you best.
      </p>
    </div>

    {#if coachStatus?.myCoachProfile}
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <GraduationCap class="size-5" />
            You already have a coach profile
          </Card.Title>
          <Card.Description>
            Manage your own coaching offer from the profile page.
          </Card.Description>
        </Card.Header>
        <Card.Content class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="grid gap-3 sm:grid-cols-3">
            <div>
              <div class="text-muted-foreground text-xs uppercase">Rate</div>
              <div class="text-lg font-semibold">
                {coachStatus.myCoachProfile.price_dkk} DKK
              </div>
            </div>
            <div>
              <div class="text-muted-foreground text-xs uppercase">Capacity</div>
              <div class="text-lg font-semibold">
                {coachStatus.myCoachProfile.max_clients ?? 'Unlimited'}
              </div>
            </div>
            <div>
              <div class="text-muted-foreground text-xs uppercase">Role</div>
              <div class="text-lg font-semibold">Coach</div>
            </div>
          </div>

          <Button href="/profile" variant="outline">Open profile</Button>
        </Card.Content>
      </Card.Root>
    {/if}

    {#if coachStatus?.connectedCoach && !coachStatus?.myCoachProfile}
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <Users class="size-5" />
            Current coach
          </Card.Title>
          <Card.Description>
            You are currently on this coach's client roster.
          </Card.Description>
        </Card.Header>
        <Card.Content class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-center gap-4">
            <Avatar.Root class="size-12 rounded-lg">
              {#if coachStatus.connectedCoach.users.picture}
                <Avatar.Image
                  src={coachStatus.connectedCoach.users.picture}
                  alt={coachStatus.connectedCoach.users.name}
                />
              {/if}
              <Avatar.Fallback class="rounded-lg">
                {initials(coachStatus.connectedCoach.users.name) || 'C'}
              </Avatar.Fallback>
            </Avatar.Root>

            <div>
              <div class="text-lg font-semibold">
                {coachStatus.connectedCoach.users.name}
              </div>
              <div class="text-muted-foreground text-sm">
                {coachStatus.connectedCoach.price_dkk} DKK
              </div>
            </div>
          </div>

          <div class="flex gap-3">
            <Button
              variant="outline"
              disabled={leavingCoach}
              onclick={handleLeaveCoach}
            >
              {leavingCoach ? 'Leaving...' : 'Leave roster'}
            </Button>
          </div>
        </Card.Content>
      </Card.Root>
    {/if}

    <Card.Root>
      <Card.Header>
        <Card.Title>Available coaches</Card.Title>
        <Card.Description>
          {availableCoaches.length} coach{availableCoaches.length === 1 ? '' : 'es'} with room for new clients.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        {#if availableCoaches.length === 0}
          <div class="border-border bg-muted/20 rounded-lg border p-6 text-sm">
            <div class="mb-2 flex items-center gap-2 font-medium">
              <BadgeInfo class="size-4" />
              No open spots right now
            </div>
            <p class="text-muted-foreground">
              When coaches add more capacity, they will appear here automatically.
            </p>
          </div>
        {:else}
          <div class="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {#each availableCoaches as coach (coach.id)}
              <Card.Root size="sm">
                <Card.Header>
                  <div class="flex items-start gap-3">
                    <Avatar.Root class="size-11 rounded-lg">
                      {#if coach.picture}
                        <Avatar.Image src={coach.picture} alt={coach.name} />
                      {/if}
                      <Avatar.Fallback class="rounded-lg">
                        {initials(coach.name) || 'C'}
                      </Avatar.Fallback>
                    </Avatar.Root>

                    <div class="min-w-0 flex-1">
                      <Card.Title class="flex items-center gap-2">
                        <span class="truncate">{coach.name}</span>
                        {#if coach.isCurrentCoach}
                          <span class="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                            Current
                          </span>
                        {/if}
                      </Card.Title>
                      <Card.Description>{coach.email}</Card.Description>
                    </div>
                  </div>
                </Card.Header>

                <Card.Content class="flex flex-col gap-4">
                  <div class="grid gap-2 text-sm">
                    <div class="flex justify-between gap-3">
                      <span class="text-muted-foreground">Rate</span>
                      <span class="font-medium">{coach.priceDkk} DKK</span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-muted-foreground">Clients</span>
                      <span>
                        {coach.currentClients} / {coach.maxClients ?? 'Unlimited'}
                      </span>
                    </div>
                    <div class="flex justify-between gap-3">
                      <span class="text-muted-foreground">Open slots</span>
                      <span>{coach.remainingSlots ?? 'Unlimited'}</span>
                    </div>
                  </div>

                  <Button
                    disabled={
                      Boolean(coachStatus?.myCoachProfile) ||
                      joiningCoachId !== null ||
                      coach.isCurrentCoach
                    }
                    variant={coach.isCurrentCoach ? 'outline' : 'default'}
                    onclick={() => handleJoinCoach(coach.id)}
                  >
                    {#if coach.isCurrentCoach}
                      <Check class="size-4" />
                      Joined
                    {:else if joiningCoachId === coach.id}
                      Joining...
                    {:else if coachStatus?.myCoachProfile}
                      Coaches cannot join another coach
                    {:else}
                      Join roster
                    {/if}
                  </Button>
                </Card.Content>
              </Card.Root>
            {/each}
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
  {/if}
</div>
