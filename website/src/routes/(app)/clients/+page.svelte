<script lang="ts">
  import Users from '@lucide/svelte/icons/users';
  import UserRoundX from '@lucide/svelte/icons/user-round-x';
  import * as Card from '$lib/components/ui/card/index.js';
</script>

<div class="flex flex-col gap-6">
  <div>
    <h1 class="text-3xl font-semibold tracking-tight">Clients</h1>
    <p class="text-muted-foreground">
      Client management stays on standby until the backend exposes coach-client relationships.
    </p>
  </div>

  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <Users class="size-5" />
        Client dashboard placeholder
      </Card.Title>
      <Card.Description>
        This view will later show connected clients, assigned programs, and recent activity.
      </Card.Description>
    </Card.Header>
    <Card.Content class="flex flex-col gap-4">
      <div class="border-border bg-muted/20 rounded-lg border p-4 text-sm">
        <div class="mb-2 flex items-center gap-2 font-medium">
          <UserRoundX class="size-4" />
          Not available yet
        </div>
        <p class="text-muted-foreground">
          The current backend does not expose client data for coaches, so this page is acting as a placeholder instead of trying to fake a dataset.
        </p>
      </div>
    </Card.Content>
  </Card.Root>
</div>
