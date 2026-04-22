<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  onMount(async () => {
    try {
      const response = await fetch("/api/me", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Not authenticated");
      }

      goto("/dashboard");
    } catch {
      goto("/signin");
    }
  });
</script>

<div
  style="display: flex; align-items: center; justify-content: center; height: 100vh;"
>
  <p>Loading...</p>
</div>
