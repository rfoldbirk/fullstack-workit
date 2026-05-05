<script>
  import { Button, buttonVariants } from "@/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import * as Popover from "$lib/components/ui/popover";
  import EllipsisVertical from "@lucide/svelte/icons/ellipsis-vertical";

  const { remove_exercise_fn, move_up_fn, move_down_fn } = $props();
</script>

<Popover.Root>
  <Popover.Trigger class="{buttonVariants({ variant: "outline" })} cursor-pointer"><EllipsisVertical /></Popover.Trigger>
  <Popover.Content class="w-60">
    <div class="grid gap-2">
          <Button onclick={move_up_fn} class="{buttonVariants({ variant: "outline" })} text-foreground cursor-pointer">Move Up</Button>
          <Button onclick={move_down_fn} class="{buttonVariants({ variant: "outline" })} text-foreground cursor-pointer">Move Down</Button>
          <Button onclick={remove_exercise_fn} class="{buttonVariants({ variant: "destructive" })} cursor-pointer"> Remove Exercise </Button>
      <!-- </div> -->
    </div>
  </Popover.Content>
</Popover.Root>
