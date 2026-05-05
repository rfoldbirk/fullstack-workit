import type { SimpleSet } from "@/api/types";
import type { PageProps } from './$types';


export async function upload() {
  let state_str = localStorage.getItem("routine_data");
  let routine_str = localStorage.getItem("routine");
  let routine_name = localStorage.getItem("routine_name");
  let routine_id = localStorage.getItem('routine_id');
  if (!state_str || !routine_str || !routine_name) return;

  let routine = JSON.parse(routine_str);



  // first we delete all exercises from the program template
  await fetch(`/api/coach/program-templates/${routine_id}/exercises`, {
    method: "DELETE",
  });

  // patch routine_name
  await fetch(`/api/coach/program-templates/${routine_id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: routine_name, description: '' }),
  });

  // go through each exercise and upload it
  let index = 1;
  for (const exercise of routine) {
    // loop through set
    for (let set of exercise.sets) {
      let body = JSON.stringify({
        templateId: routine_id,
        exercise_id: exercise.id,
        order_nr: index,
        rest_timer: exercise.rest_timer,
        weight_kg: set.weight,
        reps: set.reps,
      });
      index++;

      await fetch(`/api/coach/program-templates/${routine_id}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
    }

    let note = exercise.note;
  }
}
