<script lang="ts">
  import { onMount } from "svelte";
  import Activity from "@lucide/svelte/icons/activity";
  import GraduationCap from "@lucide/svelte/icons/graduation-cap";
  import Ruler from "@lucide/svelte/icons/ruler";
  import Scale from "@lucide/svelte/icons/scale";
  import * as Card from "$lib/components/ui/card/index.js";
  import WeightChart from "$lib/components/health/WeightChart.svelte";
  import type {
    CoachProfileResponse,
    MeResponse,
    WeightLogHistory,
  } from "$lib/api/types";

  type AssignedWorkoutPlaceholder = {
    id: string;
    title: string;
    description: string;
    exerciseCount: number | null;
    updatedAt: string | null;
  };

  let meResponse: MeResponse | null = $state(null);
  let weightHistory: WeightLogHistory = $state([]);
  let coachData: CoachProfileResponse | null = $state(null);
  let loading = $state(true);
  let error = $state("");

  onMount(async () => {
    try {
      const [me, history, coach] = await Promise.all([
        fetchJson<MeResponse>("/api/me", "Failed to load dashboard"),
        fetchJson<WeightLogHistory>(
          "/api/me/weight-logs",
          "Failed to load dashboard",
        ),
        fetchJson<CoachProfileResponse>(
          "/api/me/coach",
          "Failed to load dashboard",
        ),
      ]);

      meResponse = me;
      weightHistory = history;
      coachData = coach;
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load dashboard";
    } finally {
      loading = false;
    }
  });

  const latestWeight = $derived.by(() => {
    const latestFromHistory =
      weightHistory.find((entry) => entry.weight !== null)?.weight ?? null;
    return latestFromHistory ?? meResponse?.weight_kg ?? null;
  });

  const bmi = $derived.by(() =>
    calculateBmi(latestWeight, meResponse?.height_cm ?? null),
  );

  const assignedWorkouts = $derived.by(() =>
    buildAssignedWorkoutPlaceholders(coachData),
  );

  function calculateBmi(weightKg: number | null, heightCm: number | null) {
    if (!weightKg || !heightCm || heightCm <= 0) {
      return { value: null, category: null };
    }

    const heightM = heightCm / 100;
    const value = Number((weightKg / (heightM * heightM)).toFixed(1));

    let category = "Healthy range";
    if (value < 18.5) category = "Underweight";
    else if (value >= 25 && value < 30) category = "Overweight";
    else if (value >= 30) category = "Obesity";

    return { value, category };
  }

  function buildAssignedWorkoutPlaceholders(
    coach: CoachProfileResponse | null,
  ): AssignedWorkoutPlaceholder[] {
    if (coach?.connectedCoach) {
      return [
        {
          id: "connected-coach-placeholder",
          title: "Coach assignment placeholder",
          description: `${coach.connectedCoach.users.name} has not assigned a workout yet. Assigned plans will appear here when they are ready.`,
          exerciseCount: null,
          updatedAt: null,
        },
      ];
    }

    return [
      {
        id: "no-coach-placeholder",
        title: "No coach assigned workouts yet",
        description:
          "Connect with a coach to start receiving structured workout plans here.",
        exerciseCount: null,
        updatedAt: null,
      },
    ];
  }

  async function fetchJson<T>(
    url: string,
    fallback: string,
    init?: RequestInit,
  ): Promise<T> {
    const response = await fetch(url, {
      ...init,
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, fallback));
    }
    return (await response.json()) as T;
  }

  async function readErrorMessage(
    response: Response,
    fallback: string,
  ): Promise<string> {
    try {
      const payload = (await response.json()) as {
        error?: string | { message?: string };
      };
      const error = payload.error;
      return typeof error === "string" ? error : (error?.message ?? fallback);
    } catch {
      return fallback;
    }
  }

  function formatDate(value: string | null): string {
    return value ? new Date(value).toLocaleDateString() : "Ready when assigned";
  }
</script>

<div class="flex flex-col gap-6">
  {#if loading}
    <div class="py-8 text-center">
      <p class="text-muted-foreground">Loading...</p>
    </div>
  {:else if error}
    <div class="py-8 text-center">
      <p class="text-destructive">{error}</p>
    </div>
  {:else if meResponse}
    <div>
      <h1 class="text-3xl font-semibold tracking-tight">
        Welcome back, {meResponse.name}
      </h1>
      <p class="text-muted-foreground">
        Here's a quick look at your progress, coach status, and workout space.
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <Scale class="size-4" />
            Current weight
          </Card.Title>
          <Card.Description>Your latest logged weight.</Card.Description>
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-semibold">
            {latestWeight !== null ? `${latestWeight} kg` : "—"}
          </div>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <Activity class="size-4" />
            BMI
          </Card.Title>
          <Card.Description
            >Calculated from your latest weight and height.</Card.Description
          >
        </Card.Header>
        <Card.Content class="flex flex-col gap-2">
          <div class="text-2xl font-semibold">
            {bmi.value !== null ? bmi.value : "—"}
          </div>
          <div class="text-muted-foreground text-sm">
            {bmi.category ??
              "Add both height and weight in your profile to see BMI."}
          </div>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <GraduationCap class="size-4" />
            Coach
          </Card.Title>
          <Card.Description>Your coaching setup.</Card.Description>
        </Card.Header>
        <Card.Content class="flex flex-col gap-2">
          {#if coachData?.connectedCoach}
            <div class="text-lg font-medium">
              {coachData.connectedCoach.users.name}
            </div>
            <div class="text-muted-foreground text-sm">
              {coachData.connectedCoach.price_dkk} DKK
            </div>
          {:else if coachData?.myCoachProfile}
            <div class="text-lg font-medium">You are available as a coach</div>
            <div class="text-muted-foreground text-sm">
              Max clients:
              {coachData.myCoachProfile.max_clients ?? "Unlimited"}
            </div>
          {:else}
            <div class="text-lg font-medium">No coach connected</div>
            <div class="text-muted-foreground text-sm">
              Set up your coach profile or connect to one from the Coach page.
            </div>
          {/if}
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <Ruler class="size-4" />
            Height
          </Card.Title>
          <Card.Description>Used together with weight for BMI.</Card.Description
          >
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-semibold">
            {meResponse.height_cm !== null ? `${meResponse.height_cm} cm` : "—"}
          </div>
        </Card.Content>
      </Card.Root>
    </div>

    <div class="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
      <Card.Root>
        <Card.Header>
          <Card.Title>Weight Trend</Card.Title>
          <Card.Description>
            Your recent weight history from the profile log.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <WeightChart
            entries={weightHistory}
            emptyLabel="Log a weight entry in your profile to see the trend here."
          />
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title>Coach Assigned Workouts</Card.Title>
          <Card.Description>
            Placeholder space for plans your coach assigns to you.
          </Card.Description>
        </Card.Header>
        <Card.Content class="flex flex-col gap-3">
          {#each assignedWorkouts as workout (workout.id)}
            <div class="border-border bg-muted/20 rounded-lg border p-4">
              <div class="mb-2 flex items-start justify-between gap-3">
                <div>
                  <div class="font-medium">{workout.title}</div>
                  <div class="text-muted-foreground mt-1 text-sm">
                    {workout.description}
                  </div>
                </div>
                <span
                  class="bg-secondary text-secondary-foreground rounded-full px-2 py-1 text-xs font-medium"
                >
                  Placeholder
                </span>
              </div>

              <div
                class="text-muted-foreground grid gap-2 text-sm sm:grid-cols-2"
              >
                <div>
                  Exercises: {workout.exerciseCount !== null
                    ? workout.exerciseCount
                    : "TBD"}
                </div>
                <div>Updated: {formatDate(workout.updatedAt)}</div>
              </div>
            </div>
          {/each}

          <a
            href="/workouts"
            class="text-sm font-medium underline-offset-4 hover:underline"
          >
            Open workouts →
          </a>
        </Card.Content>
      </Card.Root>
    </div>
  {/if}
</div>
