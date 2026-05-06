<script lang="ts">
  import { Button, buttonVariants } from "@/components/ui/button";
  import Input from "@/components/ui/input/input.svelte";
  import Label from "@/components/ui/label/label.svelte";
  import Dumbbell from "@lucide/svelte/icons/dumbbell";
  import Plus from "@lucide/svelte/icons/plus";
  import { onMount } from "svelte";
  import X from "@lucide/svelte/icons/x";
  import { Slider } from "@/components/ui/slider";
  import EditSet from "../editor/components/edit_set.svelte";
  import type { Exercise, SimpleSet } from "@/api/types";
  import AddExercise from "../editor/components/add_exercise.svelte";
  import { page } from "$app/state";
  import type { PageProps } from "./$types";
  import { Checkbox } from "@/components/ui/checkbox";
  import { goto } from "$app/navigation";

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
  let workout_in_progress = $state({ id: -1 });
  let routine: SetExercise[] = $state([]);
  let routine_name = $state("");

  let logs: {
    id: number;
    reps: number;
    kg: number;
    exercise_id: number;
    program_log_id: number;
    set_nr: number;
    exercise: {
      id: number;
      name: String;
      description: String;
      equipment: String;
    };
  }[] = $state([]);

  function upload() {}

  onMount(async () => {
    if (localStorage.getItem("workout_inprogress") === null) {
      goto("/workouts");
      return;
    }

    workout_in_progress = JSON.parse(localStorage.getItem("workout_inprogress") || "{ id: -1 }");

    // load all exercises
    const response = await fetch("/api/exercises");
    all_exercises = await response.json();

    // load routine from server
    const routine_response = await fetch("/api/me/workout-logs/" + workout_in_progress.id);
    let routine_data = await routine_response.json();
    let template = routine_data.template;

    logs = routine_data.exercise_log;

    routine_name = template.name;

    let current_exercise: SetExercise = {
      id: 0,
      uuid: 0,
      note: "",
      rest_timer: 0,
      sets: [],
    };

    for (let set of template.exercises) {
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
          note: "",
          sets: [{ reps: set.reps, weight: set.weight_kg }],
          rest_timer: set.rest_timer,
        };

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
    let id = setTimeout(upload, 300);
    for (const tid of timeout_ids) {
      clearTimeout(tid);
    }
    timeout_ids.push(id);

    localStorage.setItem("routine_id", params.id);

    if (routine.length == 0) return;
    localStorage.setItem("routine", JSON.stringify(routine));
    console.log("Routine was saved!");

    if (routine_name.length == 0) return;
    localStorage.setItem("routine_name", routine_name);
  });

  async function log_exercise(ex_index: number, set_index: number) {
    const exercise = routine[ex_index];
    const info = all_exercises.find((e) => e.id == exercise.id);

    // jeg har brug for
    // route: /api/me/workout-logs/1/exercise-logs
    // body: {
    //   "exercise_id": 19,
    //   "set_nr": 1,
    //   "reps": 7,
    //   "kg": 60
    // }

    let resp = await fetch("/api/me/workout-logs/" + workout_in_progress.id + "/exercise-logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        exercise_id: exercise.id,
        set_nr: set_index + 1,
        reps: exercise.sets[set_index].reps,
        kg: exercise.sets[set_index].weight,
      }),
    });

    let json = await resp.json();
    console.log(json);

    if (json.error) {
      console.log("Error: " + json.error);
      return;
    }

    logs.push(json);
  }

  function finish_workout() {
    localStorage.removeItem("routine");
    localStorage.removeItem("routine_name");
    localStorage.removeItem("routine_id");
    localStorage.removeItem("routine_data");
    localStorage.removeItem("workout_inprogress");

    fetch(`/api/me/workout-logs/${workout_in_progress.id}/finish`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: "Good workout, felt strong" }),
    });
  }

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
</script>

<div class="flex w-full flex-col gap-2">
  <h1 class="text-xl flex gap-1">
    <p class="text-muted-foreground">Routine:</p>
    {routine_name}
  </h1>
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
      </div>

      <!-- Rest timer -->
      <div class="flex w-full flex-col gap-4 pt-2 pb-2">
        <Label class="text-accent-foreground" for="note-{e_index}"
          >Rest timer: {display_min(exercise.rest_timer)}:{display_sec(exercise.rest_timer)}</Label
        >
      </div>

      <!-- Sets  -->
      <div class="flex justify-between gap-2">
        <p class="text-xs text-center bg-accent rounded-lg p-2 w-12">SET</p>
        <!-- <p class="text-xs text-center bg-accent rounded-lg p-2 w-1/2">PREVIOUS</p> -->
        <p class="text-xs text-center bg-accent rounded-lg p-2 w-1/2">WEIGHT KG</p>
        <p class="text-xs text-center bg-accent rounded-lg p-2 w-1/2">REPS</p>
        <p class="text-xs text-center bg-accent rounded-lg p-2 w-8"></p>
      </div>

      {#each exercise.sets as set, set_index}
        {@const logged = logs.find((l) => l.exercise_id == exercise.id && l.set_nr == set_index + 1)}
        <div class="flex justify-between gap-2">
          <Input disabled class="text-xs w-12 text-center" value={set_index} />
          <!-- <Input disabled type="number" min="0" max="500" class="text-xs text-center w-1/2"></Input> -->
          <Input disabled={logged} bind:value={set.weight} type="number" min="0" max="500" class="text-xs text-center w-1/2"></Input>
          <Input disabled={logged} bind:value={set.reps} type="number" min="0" max="500" class="text-xs text-center w-1/2"></Input>

          <div class="w-6 flex items-center">
            {#if logs.find((l) => l.exercise_id == exercise.id && l.set_nr == set_index + 1)}
              <Checkbox checked={true} disabled />
            {:else}
              <Checkbox onclick={() => log_exercise(e_index, set_index)} class="w-6 h-6" id={`${exercise.id}-${set_index}`} />
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/each}
</div>

<br />

<div class="flex justify-center">
  <Button class="cursor-pointer p-2 w-1/2" onclick={finish_workout}>Finish workout</Button>
</div>
