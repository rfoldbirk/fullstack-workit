export async function update_routine_name(routine_id: string, routine_name: string) {
  console.log("updating routine name:", routine_name + " (" + routine_id + ")");
  // patch routine_name
  await fetch(`/api/coach/program-templates/${routine_id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: routine_name, description: "" }),
  });
}

export async function upload(routine_id: string, routine: any[]): Promise<true | string> {
  try {
    // first we delete all exercises from the program template
    await fetch(`/api/coach/program-templates/${routine_id}/exercises`, {
      method: "DELETE",
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

        let resp = await fetch(`/api/coach/program-templates/${routine_id}/exercises`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });

        let data = await resp.json();
        if (data.error) throw data.error;
      }
    }
    return true;
  } catch (err) {
    console.log(err);
    return JSON.stringify(err);
  }
}
