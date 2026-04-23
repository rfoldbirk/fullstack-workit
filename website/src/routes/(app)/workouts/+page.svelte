<script lang="ts">
  import { Button } from "@/components/ui/button";
  import Dumbbell from "@lucide/svelte/icons/dumbbell";
  import Plus from "@lucide/svelte/icons/plus";
</script>

<div class="flex flex-col gap-6">
  <div>
    <h1 class="text-3xl font-semibold tracking-tight">Workouts</h1>
    <p class="text-muted-foreground">Programs and workout planning are coming soon.</p>
  </div>

  <div
    class="border-border flex flex-col items-center gap-4 rounded-lg border border-dashed p-12 text-center"
  >
    <Dumbbell class="text-muted-foreground size-12" />
    <div>
      <h2 class="text-lg font-semibold">Program builder</h2>
      <p class="text-muted-foreground mt-1 max-w-md text-sm">
        Ready to build a tailorsuited program for your clients?
      </p>

      <Button href="/workouts/new" class="mt-2 cursor-pointer"><Plus /> Create Program</Button>
    </div>
  </div>
</div>
