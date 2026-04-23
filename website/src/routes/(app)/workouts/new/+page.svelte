<script lang="ts">
  import { Button } from "@/components/ui/button";
  import { Textarea } from "$lib/components/ui/textarea";
  import Dumbbell from "@lucide/svelte/icons/dumbbell";
  import Plus from "@lucide/svelte/icons/plus";
  import type { Exercise } from "$lib/api/types";
  import Separator from "@/components/ui/separator/separator.svelte";

  let expandExercise: undefined | number = $state(0);

  function expandSetItem(index: number) {
    expandExercise = index;
  }

  // A single set within an exercise (reps, weight, rest, optional comment)
  type SingleSet = {
    comment?: string;
    reps: number;
    rest: number; // seconds
    weight: number; // kg
  };

  // A SetItem represents an exercise with one or more sets
  type SetItem = {
    ex: Exercise;
    sets: SingleSet[];
    expanded?: boolean;
  };

  let sets: SetItem[] = $state([
    {
      ex: {
        id: 1,
        name: "Crunch",
        description:
          "A basic abdominal exercise performed by curling the torso upward while lying on the floor.",
        equipment: "None",
        muscleGroups: [],
        ownerId: 2,
      },
      sets: [
        { comment: "hej", reps: 12, rest: 60, weight: 0 },
        { comment: "hej", reps: 12, rest: 60, weight: 0 },
      ],
      expanded: false,
    },
    {
      ex: {
        id: 1,
        name: "Tarteletter",
        description:
          "A basic abdominal exercise performed by curling the torso upward while lying on the floor.",
        equipment: "None",
        muscleGroups: [],
        ownerId: 2,
      },
      sets: [{ comment: "hej", reps: 12, rest: 60, weight: 0 }],
      expanded: false,
    },
  ]);

  function increaseSet(setItem: SetItem) {
    setItem.sets.push(setItem.sets[setItem.sets.length - 1]);
  }

  function addExercise() {
    const nextId = Date.now();
    sets = [
      ...sets,
      {
        ex: {
          id: nextId,
          name: "New Exercise",
          description: "",
          equipment: "None",
          muscleGroups: [],
          ownerId: 0,
        },
        sets: [{ comment: undefined, reps: 8, rest: 60, weight: 0 }],
        expanded: true,
      },
    ];
  }

  function removeExercise(index: number) {
    sets = sets.filter((_, i) => i !== index);
  }

  function toggleExpand(index: number) {
    sets[index].expanded = !sets[index].expanded;
    // reassign to trigger Svelte reactivity for nested changes
    sets = [...sets];
  }

  function addSetToExercise(index: number) {
    sets[index].sets.push({ comment: "", reps: 8, rest: 60, weight: 0 });
    sets = [...sets];
  }

  function removeSetFromExercise(exIndex: number, setIndex: number) {
    sets[exIndex].sets.splice(setIndex, 1);
    sets = [...sets];
  }
</script>

<div class="flex flex-col gap-6">
  <div>
    <h1 contenteditable="true" class="text-3xl font-semibold tracking-tight">Click to make a title</h1>
    <p contenteditable="true" class="text-muted-foreground">
      Hey there! Everything is editable - so just click to begin editing :)
    </p>

    <Separator class="mt-2 mb-5" />

    {#each sets as setItem, index}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore event_directive_deprecated -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div on:click={() => expandSetItem(index)} class="grid mt-2 p-2 rounded border bg-accent">
        <div class="flex items-start justify-between">
          <div>
            <h2 class="font-bold">{setItem.ex.name}</h2>
            <h4 class="text-sm text-muted-foreground">{setItem.ex.description}</h4>
          </div>
          <div class="flex gap-2 items-center text-sm text-muted-foreground">
            <Dumbbell />
            <span>Equipment: {setItem.ex.equipment}</span>
          </div>
        </div>

        <div class="grid sm:grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          {#if index === expandExercise}
            {#each setItem.sets as set, setIndex}
              <div class="">
                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <!-- svelte-ignore a11y_label_has_associated_control -->
                    <label class="text-xs text-muted-foreground">Reps</label>
                    <input
                      type="number"
                      min="0"
                      bind:value={set.reps}
                      class="w-full rounded border px-2 py-1 mt-1"
                    />
                  </div>

                  <div>
                    <!-- svelte-ignore a11y_label_has_associated_control -->
                    <label class="text-xs text-muted-foreground">Weight (kg)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      bind:value={set.weight}
                      class="w-full rounded border px-2 py-1 mt-1"
                    />
                  </div>

                  <div>
                    <!-- svelte-ignore a11y_label_has_associated_control -->
                    <label class="text-xs text-muted-foreground">Rest (s)</label>
                    <input
                      type="number"
                      min="0"
                      bind:value={set.rest}
                      class="w-full rounded border px-2 py-1 mt-1"
                    />
                  </div>
                </div>

                <div class="col-span-1 sm:col-span-2 md:col-span-1">
                  {#if !set.comment}
                    <Button class="w-full mt-2 bg-muted-foreground cursor-pointer">Add comment</Button>
                  {:else}
                    <!-- svelte-ignore a11y_label_has_associated_control -->
                    <label class="text-xs text-muted-foreground">Comment</label>
                    <Textarea class="mt-1" bind:value={set.comment} placeholder="Add comment to exercise" />
                  {/if}
                </div>
              </div>

              {#if setIndex != setItem.sets.length - 1}
                <Separator />
              {/if}
            {/each}
          {/if}
        </div>
        <!-- <button on:click={() => increaseSet(thing)}> add set </button> -->
      </div>
    {/each}

    <div class="grid mt-5">
      <!-- <Button on:click={addExercise}><Plus /> Add an exercise</Button> -->
    </div>
  </div>
</div>
