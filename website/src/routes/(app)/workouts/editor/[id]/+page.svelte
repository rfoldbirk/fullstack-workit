<script lang="ts">
  import { Button, buttonVariants } from "@/components/ui/button";
  import * as InputGroup from "$lib/components/ui/input-group";
  import Input from "@/components/ui/input/input.svelte";
  import Label from "@/components/ui/label/label.svelte";
  import Dumbbell from "@lucide/svelte/icons/dumbbell";
  import Plus from "@lucide/svelte/icons/plus";
  import SearchIcon from "@lucide/svelte/icons/search";
  import { onMount } from "svelte";
  import EllipsisVertical from "@lucide/svelte/icons/ellipsis-vertical";
  import X from "@lucide/svelte/icons/x";
  import * as Dialog from "$lib/components/ui/dialog";
  import { ScrollArea } from "@/components/ui/scroll-area";
  import { Separator } from "@/components/ui/separator";
  import { Slider } from "@/components/ui/slider";
  import EditSet from "../components/edit_set.svelte";
  import { describe } from "zod/mini";
  import type { Exercise } from "@/api/types";
  import AddExercise from "../components/add_exercise.svelte";

  import { page } from "$app/state";
  import { replaceState } from "$app/navigation";
    import { upload } from "./upload";

  let all_exercises: Exercise[] = $state([]);

  // binded values
  let name_val = $state("");

  onMount(async () => {
    if (page.state.id != undefined) {
      localStorage.setItem("routine_data", JSON.stringify(page.state));
      console.log("Successfully saved routine data to localStorage");

      name_val = page.state.name;
    } else {
      let rd = localStorage.getItem("routine_data");
      if (rd) {
        let state = JSON.parse(rd);
      }
    }

    let res = await fetch("/api/exercises");
    all_exercises = await res.json();
  });

  type SetExercise = {
    uuid: number;
    id: number;
    note: String;
    rest_timer: number;
    sets: Set[];
  };

  type Set = {
    weight: number;
    reps: number;
  };

  let routine: SetExercise[] = $state([]);

  $effect(() => {
    if (routine.length == 0) return;
    localStorage.setItem('routine', JSON.stringify(routine));
    console.log('Routine was saved!')

    if (name_val.length == 0) return;
    localStorage.setItem('routine_name', name_val);
  })

  function display_min(raw_number: number): string {
    const val = Math.floor(raw_number / 60);
    if (val < 10) {
      return "0" + val;
    }
    return val.toString();
  }

  function display_sec(raw_number: number): string {
    const val = raw_number % 60;
    if (val < 10) {
      return "0" + val;
    }
    return val.toString();
  }

  function add_set(exercise: SetExercise) {
    let last_set = exercise.sets.at(-1);
    if (last_set == undefined) {
      return;
    }

    exercise.sets.push({ reps: last_set.reps, weight: last_set.weight });
  }

  function remove_set(exercise: SetExercise, set_index: number) {
    let set = exercise.sets.findIndex((_s, i) => i == set_index);
    if (set == undefined) return;

    exercise.sets.splice(set, 1);
  }

  function move_up(exercise_uuid: number) {
    let exercise = routine.find((e) => e.uuid == exercise_uuid);
    if (exercise == undefined) return;

    let index = routine.findIndex((e) => e.uuid == exercise_uuid);
    if (index == 0) return;

    routine.splice(index, 1);
    routine.splice(index - 1, 0, exercise);
  }

  function move_down(exercise_uuid: number) {
    let exercise = routine.find((e) => e.uuid == exercise_uuid);
    if (exercise == undefined) return;

    let index = routine.findIndex((e) => e.uuid == exercise_uuid);
    if (index == routine.length - 1) return;

    routine.splice(index, 1);
    routine.splice(index + 1, 0, exercise);
  }

  function remove_exercise(e_id: number) {
    routine.splice(e_id, 1);
  }
</script>

<div class="flex w-full flex-col gap-2">
  <Label for="routine-id">Routine Title</Label>
  <Input bind:value={name_val} class="w-full" type="text" id="routine-id" placeholder="Workout Routine Title" />
</div>

<br />

<div class="grid gap-6">
  {#each routine as exercise, e_index (exercise.uuid)}
    {@const info = all_exercises.find((e) => e.id == exercise.id)}

    <div class="grid gap-2 bg-white dark:bg-background border shadow p-2 rounded-lg">
      <!-- Overview -->
      <div class="flex items-center justify-between w-full">
        <div class="flex gap-2">
          <Dumbbell />
          <h1>{info?.name || "Something went wrong"}</h1>
        </div>

        <EditSet
          move_down_fn={() => move_down(exercise.uuid)}
          move_up_fn={() => move_up(exercise.uuid)}
          remove_exercise_fn={() => remove_exercise(e_index)}
        />
      </div>

      <!-- Note  -->
      <div class="flex w-full flex-col gap-2">
        <Label for="note-{e_index}">Note:</Label>
        <Input bind:value={exercise.note} class="w-full" type="text" id="note-{e_index}" placeholder="Add pinned note" />
      </div>

      <br />

      <!-- Rest timer -->
      <div class="flex w-full flex-col gap-4 pt-2 pb-2">
        <Label for="note-{e_index}">Rest timer: {display_min(exercise.rest_timer)}:{display_sec(exercise.rest_timer)}</Label>
        <Slider class="" type="single" bind:value={exercise.rest_timer} max={300} step={1} />
      </div>

      <!-- Sets  -->
      <div class="flex justify-between gap-2">
        <p class="text-xs text-center bg-accent rounded-lg p-2 w-12">SET</p>
        <p class="text-xs text-center bg-accent rounded-lg p-2 w-1/2">WEIGHT KG</p>
        <p class="text-xs text-center bg-accent rounded-lg p-2 w-1/2">REPS</p>
        {#if exercise.sets.length > 1}
          <p class="text-xs text-center bg-accent rounded-lg p-2 w-6"></p>
        {/if}
      </div>

      {#each exercise.sets as set, set_index}
        <div class="flex justify-between gap-2">
          <Input disabled class="text-xs w-12 text-center" value={set_index} />
          <Input bind:value={set.weight} type="number" min="0" max="500" class="text-xs text-center w-1/2"></Input>
          <Input bind:value={set.reps} type="number" min="0" max="500" class="text-xs text-center w-1/2"></Input>

          {#if exercise.sets.length > 1}
            <Button onclick={() => remove_set(exercise, set_index)} class="cursor-pointer w-6 bg-accent hover:bg-accent text-muted-foreground"
              ><X /></Button
            >
          {/if}
        </div>
      {/each}

      <!-- Add set button -->
      <Button onclick={() => add_set(exercise)} class="bg-secondary cursor-pointer hover:bg-accent text-secondary-foreground"><Plus /> Add Set</Button
      >
    </div>
  {/each}
</div>

<br />

<AddExercise {all_exercises} {routine} />

<br />

<div class="w-full flex justify-center">
  <Button onclick={ upload } class="w-1/3 cursor-pointer hover:bg-blue-400 bg-blue-500 dark:text-white"> Upload </Button>
</div>
