<script lang="ts">
  import { Button, buttonVariants } from "@/components/ui/button";
  import Input from "@/components/ui/input/input.svelte";
  import Label from "@/components/ui/label/label.svelte";
  import Dumbbell from "@lucide/svelte/icons/dumbbell";
  import Plus from "@lucide/svelte/icons/plus";
  import { onMount } from "svelte";
  import X from "@lucide/svelte/icons/x";
  import { Slider } from "@/components/ui/slider";
  import EditSet from "../components/edit_set.svelte";
  import type { Exercise, SimpleSet } from "@/api/types";
  import AddExercise from "../components/add_exercise.svelte";
  import { page } from "$app/state";
  import { upload } from "./upload.svelte.ts";
  import type { PageProps } from './$types';

  let { params }: PageProps = $props();

  type SetExercise = {
    uuid: number;
    id: number;
    note: String;
    rest_timer: number;
    sets: SimpleSet[];
  };


  // binded values
  let all_exercises: Exercise[] = $state([]);
  let routine: SetExercise[] = $state([]);
  let routine_name = $state("");


  onMount(async () => {
    // load all exercises
    const response = await fetch('/api/exercises');
    all_exercises = await response.json();

    // load routine from server
    const routine_response = await fetch('/api/coach/program-templates/' + params.id);
    let routine_data = await routine_response.json();

    routine_name = routine_data.name;

    let current_exercise: SetExercise = {
      id: 0,
      uuid: 0,
      note: '',
      rest_timer: 0,
      sets: [],
    };

    for (let set of routine_data.exercises) {
      if (current_exercise.id != set.exercise.id && current_exercise.id != 0) {
        let sets_clone = current_exercise.sets;
        routine.push({
          id: current_exercise.id,
          uuid: current_exercise.uuid,
          note: current_exercise.note,
          rest_timer: current_exercise.rest_timer,
          sets: sets_clone,
        });

        current_exercise.sets = [];
      }

      if (current_exercise.sets.length == 0) {
        current_exercise = {
          id: set.exercise.id,
          uuid: set.order_nr,
          note: '',
          sets: [{ reps: set.reps, weight: set.weight_kg }],
          rest_timer: set.rest_timer,
        }

        // console.table(current_exercise.sets)

        continue;
      }

      current_exercise.sets.push({ reps: set.reps, weight: set.weight_kg });
    }

    if (current_exercise.sets.length != 0) {
      routine.push(current_exercise);
    }
  });

  let timeout_ids: NodeJS.Timeout[] = [];

  $effect(() => {
    let id = setTimeout(upload, 300)
    for (const tid of timeout_ids) { clearTimeout(tid); }
    timeout_ids.push(id);

    localStorage.setItem('routine_id', params.id);

    if (routine.length == 0) return;
    localStorage.setItem('routine', JSON.stringify(routine));
    console.log('Routine was saved!')

    if (routine_name.length == 0) return;
    localStorage.setItem('routine_name', routine_name);

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
  <Input bind:value={routine_name} class="w-full" type="text" id="routine-id" placeholder="Workout Routine Title" />
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
