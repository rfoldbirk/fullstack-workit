<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog";
  import * as InputGroup from "$lib/components/ui/input-group";
  import { Button, buttonVariants } from "@/components/ui/button";
  import { ScrollArea } from "@/components/ui/scroll-area";

  import SearchIcon from "@lucide/svelte/icons/search";
  import Plus from "@lucide/svelte/icons/plus";
  import { Separator } from "@/components/ui/separator";
    import type { Exercise } from "@/api/types";

  let { routine, all_exercises } = $props();

  let uuid = $state(0);
  let isOpen = $state(false);
  let search_value = $state("");


  function filter_fn(exercise: Exercise) {
    if (search_value == "") return true;

    if (exercise.name.toLowerCase().includes(search_value.toLowerCase())) return true;
    if (exercise.description.toLowerCase().includes(search_value.toLowerCase())) return true;
    if (exercise.equipment.toLowerCase().includes(search_value.toLowerCase())) return true;

    return false;
  }

  function add_ex(id: number) {
    isOpen = false;

    uuid++;
    routine.push({
      uuid: uuid.valueOf(),
      id,
      note: "",
      rest_timer: 30,
      sets: [{ reps: 0, weight: 0 }],
    });
  }

  function changeOpen(state: boolean) {
    isOpen = state;

    search_value = "";
  }
</script>

<Dialog.Root open={isOpen} onOpenChange={changeOpen}>
  <form>
    <Dialog.Trigger type="button" class="cursor-pointer w-full {buttonVariants({ variant: 'default' })}">
      <Plus /> Add Exercise
    </Dialog.Trigger>
    <Dialog.Content class="sm:max-w-106.25">
      <Dialog.Header>
        <Dialog.Title>Select Exercise</Dialog.Title>
        <!-- <Button> <Plus /> Custom Exercise </Button> -->
      </Dialog.Header>
      <div class="grid gap-4">
        <div class="grid gap-3">
          <InputGroup.Root>
            <InputGroup.Input bind:value={search_value} placeholder="Search Exercises" />
            <InputGroup.Addon>
              <SearchIcon />
            </InputGroup.Addon>
          </InputGroup.Root>

          <ScrollArea class="h-72 w-full rounded-md border">
            <div class="p-4">
              {#each all_exercises.filter(filter_fn) as ex}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div onclick={() => add_ex(ex.id)} class="grid grid-cols-2 gap-2 hover:cursor-pointer">
                  <div class="text-sm">
                    {ex.name}
                    <p class="text-muted-foreground">{ex.equipment}</p>
                  </div>

                  <Button class="max-w-20 col-end-[none] cursor-pointer rounded-4xl bg-blue-500 dark:bg-blue-400">
                    <Plus />
                  </Button>
                </div>
                <Separator class="my-2" />
              {/each}
            </div>
          </ScrollArea>
        </div>
      </div>
    </Dialog.Content>
  </form>
</Dialog.Root>
