<script lang="ts">
  import GraduationCap from '@lucide/svelte/icons/graduation-cap';
  import BadgeInfo from '@lucide/svelte/icons/badge-info';
  import * as Card from '$lib/components/ui/card/index.js';
</script>

<div class="flex flex-col gap-6">
  <div>
    <h1 class="text-3xl font-semibold tracking-tight">Coach</h1>
    <p class="text-muted-foreground">
      Coach discovery is waiting on backend support. Coach signup lives in your profile now.
    </p>
  </div>

  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <GraduationCap class="size-5" />
        Coach directory placeholder
      </Card.Title>
      <Card.Description>
        This page is reserved for browsing and connecting to coaches once the existing backend exposes that data.
      </Card.Description>
    </Card.Header>
    <Card.Content class="flex flex-col gap-4">
      <div class="border-border bg-muted/20 rounded-lg border p-4 text-sm">
        <div class="mb-2 flex items-center gap-2 font-medium">
          <BadgeInfo class="size-4" />
          What you can do right now
        </div>
        <p class="text-muted-foreground">
          Open your profile to create or update your own coach profile. Client discovery and coach-to-user connections can drop into this page later without reshaping the rest of the app.
        </p>
      </div>

      <a href="/profile" class="text-sm font-medium underline-offset-4 hover:underline">
        Open profile →
      </a>
    </Card.Content>
  </Card.Root>
</div>
