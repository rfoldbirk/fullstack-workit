export async function upload() {
  let state = localStorage.getItem('routine_data');
  if (!state) return;
  state = JSON.parse(state);

  // upload exercises

  // upload exercises
  // let index = 0;
  // for (const exercise of routine) {
  //   fetch("/api/coach/program-templates/" + data.id + "/exercises", {
  //     body: JSON.stringify({
  //       exercise_id: exercise.id,
  //       order_nr: index,
  //     }),
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     method: "POST",
  //   });

  //   index++;
  // }
}
