<script lang="ts">
  import Dumbbell from "@lucide/svelte/icons/dumbbell";
  import GraduationCap from "@lucide/svelte/icons/graduation-cap";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import { Button } from "@/components/ui/button";
  import { goto, pushState, replaceState } from "$app/navigation";
  import { onMount } from "svelte";
  import { Skeleton } from "@/components/ui/skeleton";

  let is_coach: undefined | true | false = $state(undefined);

  let current_workout = $state(null);
  let workouts = $state([]);

  let showAssignPopup = $state(false);
  let selectedTemplateId = $state<number | null>(null);
  let clients = $state([]);
  let assignedClientIds = $state<number[]>([]);

  onMount(async () => {
    current_workout = JSON.parse(
      localStorage.getItem("workout_inprogress") ?? "null",
    );

    let me = await fetch("/api/me/coach");
    me = await me.json();
    is_coach = me?.myCoachProfile != null;

    let resp = await fetch(
      is_coach ? "/api/coach/program-templates" : "/api/me/program-templates",
    );
    let data = await resp.json();

    if (data.error) {
      console.log("der skete en fejl:", data);
      return;
    }

    workouts = data;
  });

  async function openAssignPopup(templateId: number) {
    selectedTemplateId = templateId;
    showAssignPopup = true;
    clients = [];
    assignedClientIds = [];

    const clientsRes = await fetch("/api/coach/clients");
    const clientsData = await clientsRes.json();

    if (clientsData.error) {
      console.log("der skete en fejl:", clientsData);
      return;
    }

    clients = clientsData.clients;

    const templateRes = await fetch(
      `/api/coach/program-templates/${templateId}`,
    );
    const templateData = await templateRes.json();

    if (templateData.error) {
      console.log("der skete en fejl:", templateData);
      return;
    }

    assignedClientIds = templateData.assignments.map(
      (assignment) => assignment.user_id,
    );
  }

  function closeAssignPopup() {
    showAssignPopup = false;
    selectedTemplateId = null;
    clients = [];
    assignedClientIds = [];
  }

  async function assignTemplate(clientId: number) {
    if (!selectedTemplateId) return;

    if (assignedClientIds.includes(clientId)) {
      return;
    }

    let res = await fetch(
      `/api/coach/program-templates/${selectedTemplateId}/assign/${clientId}`,
      {
        method: "POST",
      },
    );

    let data = await res.json();

    if (data.error) {
      console.log("der skete en fejl:", data);
      return;
    }

    assignedClientIds = [...assignedClientIds, clientId];
  }

  async function delete_workout(id: number) {
    fetch(`api/coach/program-templates/${id}`, {
      method: "DELETE",
    });

    // delete from workouts
    workouts = workouts.filter((w) => w.id !== id);
  }

  async function start_workout(id: number) {
    if (localStorage.getItem("workout_inprogress")) {
      console.log("workout is already");
      return;
    }

    let resp = await fetch("/api/me/workout-logs/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template_id: id }),
    });

    let data = await resp.json();
    localStorage.setItem("workout_inprogress", JSON.stringify(data));

    if (data.error) {
      console.log("der skete en fejl:", data);
      return;
    }

    goto(`/workouts/${id}`);
  }

  async function open_editor(id: number | null) {
    if (id) {
      goto(`/workouts/editor/${id}`);
      return;
    }

    let resp = await fetch("api/coach/program-templates", {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify({
        name: "Empty template",
        description: "",
      }),
    });

    let data = await resp.json();

    if (data.error) {
      console.log("der skete en fejl:", data);
      return;
    }

    goto(`/workouts/editor/${data.id}`);
  }
</script>

<div class="flex flex-col gap-6">
  <div>
    <h1 class="text-3xl font-semibold tracking-tight">Workouts</h1>
    <p class="text-muted-foreground">
      Assigned plans from a coach will show up here first.
    </p>
  </div>

  {#if is_coach === false}
    {#if current_workout}
      <div
        class="border-border bg-muted/20 rounded-lg border p-4 flex justify-between"
      >
        <div>
          <h1 class="flex gap-2 text-muted-foreground">
            Routine: <p class="text-foreground">
              {current_workout.template.name}
            </p>
          </h1>
          <h1 class="flex gap-2 text-muted-foreground">
            Exercise amount: <p class="text-foreground">
              {current_workout.template.exercises.length}
            </p>
          </h1>
        </div>
        <Button
          onclick={() => goto(`/workouts/${current_workout.template_id}`)}
          class="cursor-pointer">Continue Workout</Button
        >
      </div>
    {/if}

    <Card.Root>
      <Card.Header>
        <Card.Title class="flex items-center gap-2">
          <GraduationCap class="size-5" />
          Coach assigned workouts
        </Card.Title>
        <Card.Description
          >Placeholder space for workout plans your coach will assign.</Card.Description
        >
      </Card.Header>
      <Card.Content class="flex flex-col gap-4">
        {#each workouts as w}
          <div
            class="border-border bg-muted/20 rounded-lg border p-4 flex justify-between"
          >
            <div>
              <h1 class="flex gap-2 text-muted-foreground">
                Routine: <p class="text-foreground">{w.name}</p>
              </h1>
              <h1 class="flex gap-2 text-muted-foreground">
                Exercise amount: <p class="text-foreground">
                  {w.exercises.length}
                </p>
              </h1>
            </div>
            <Button
              disabled={current_workout != null}
              onclick={() => start_workout(w.id)}
              class="cursor-pointer">Start</Button
            >
          </div>
        {/each}
      </Card.Content>
    </Card.Root>
  {/if}

  {#if is_coach}
    <div
      class="border-border flex flex-col items-center gap-4 rounded-lg border border-dashed p-12 text-center"
    >
      <Dumbbell class="text-muted-foreground size-12" />
      <div>
        <h2 class="text-lg font-semibold">Program builder</h2>
        <p class="text-muted-foreground mt-1 max-w-md text-sm">
          Build your own program here.
        </p>

        <br />
        <Button onclick={() => open_editor(null)}>Go to the editor</Button>
      </div>
    </div>

    <!-- Display workouts -->
    {#each workouts as w}
      <div
        class="border-border bg-muted/20 rounded-lg border p-4 flex justify-between"
      >
        <div>
          <h1 class="flex gap-2 text-muted-foreground">
            Routine: <p class="text-foreground">{w.name}</p>
          </h1>
          <h1 class="flex gap-2 text-muted-foreground">
            Exercise amount: <p class="text-foreground">{w.exercises.length}</p>
          </h1>
        </div>
        <div>
          <Popover.Root>
            <Popover.Trigger>
              <Button
                onclick={() => openAssignPopup(w.id)}
                class="cursor-pointer"
              >
                Assign
              </Button>
            </Popover.Trigger>

            <Popover.Content align="end" class="w-96">
              <h2 class="mb-4 text-lg font-semibold">Assign program</h2>

              {#if clients.length === 0}
                <p class="text-muted-foreground text-sm">
                  You do not have any clients yet.
                </p>
              {:else}
                <div class="flex max-h-80 flex-col gap-3 overflow-y-auto">
                  {#each clients as client}
                    <div
                      class="border-border flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <div class="font-medium">{client.name}</div>
                        <div class="text-muted-foreground text-sm">
                          {client.email}
                        </div>
                      </div>

                      <Button
                        disabled={assignedClientIds.includes(client.id)}
                        onclick={() => assignTemplate(client.id)}
                      >
                        {assignedClientIds.includes(client.id)
                          ? "Assigned"
                          : "Assign"}
                      </Button>
                    </div>
                  {/each}
                </div>
              {/if}
            </Popover.Content>
          </Popover.Root>
          <Button onclick={() => open_editor(w.id)} class="cursor-pointer"
            >Edit</Button
          >
          <Button
            onclick={() => delete_workout(w.id)}
            variant="destructive"
            class="cursor-pointer">Delete</Button
          >
        </div>
      </div>
    {/each}
  {/if}
</div>
