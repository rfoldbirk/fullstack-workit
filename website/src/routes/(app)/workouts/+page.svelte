<script lang="ts">
  import Dumbbell from '@lucide/svelte/icons/dumbbell';
  import GraduationCap from '@lucide/svelte/icons/graduation-cap';
  import * as Card from '$lib/components/ui/card/index.js';
</script>

<div class="flex flex-col gap-6">
  <div>
    <h1 class="text-3xl font-semibold tracking-tight">Workouts</h1>
    <p class="text-muted-foreground">
      Assigned plans from a coach will show up here first.
    </p>
  </div>

  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <GraduationCap class="size-5" />
        Coach assigned workouts
      </Card.Title>
      <Card.Description>
        Placeholder space for workout plans your coach will assign.
      </Card.Description>
    </Card.Header>
    <Card.Content class="flex flex-col gap-4">
      <div class="border-border bg-muted/20 rounded-lg border p-4">
        <div class="mb-2 flex items-start justify-between gap-3">
          <div>
            <div class="font-medium">Assigned workout placeholder</div>
            <div class="text-muted-foreground mt-1 text-sm">
              When your coach starts assigning workouts, each plan will appear here with its exercise list, progress, and latest update time.
            </div>
          </div>
          <span class="bg-secondary text-secondary-foreground rounded-full px-2 py-1 text-xs font-medium">
            Placeholder
          </span>
        </div>

        <div class="text-muted-foreground grid gap-2 text-sm sm:grid-cols-2">
          <div>Exercises: TBD</div>
          <div>Updated: Ready when assigned</div>
        </div>
      </div>
    </Card.Content>
  </Card.Root>

  <div
    class="border-border flex flex-col items-center gap-4 rounded-lg border border-dashed p-12 text-center"
  >
    <Dumbbell class="text-muted-foreground size-12" />
    <div>
      <h2 class="text-lg font-semibold">Program builder placeholder</h2>
      <p class="text-muted-foreground mt-1 max-w-md text-sm">
        This page is standing in for the workout list until the existing backend exposes full program assignment flows.
      </p>
    </div>
  </div>
</div>
