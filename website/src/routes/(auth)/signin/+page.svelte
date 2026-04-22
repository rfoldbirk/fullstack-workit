<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import * as Alert from "$lib/components/ui/alert/index.js";
  import AlertCircle from "@lucide/svelte/icons/alert-circle";

  let email = $state("");
  let password = $state("");
  let error = $state("");
  let loading = $state(false);

  async function handleSubmit(event: Event) {
    event.preventDefault();
    error = "";
    loading = true;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(await readSignInErrorMessage(response));
      }
      const next = new URL($page.url).searchParams.get("next") || "/dashboard";
      goto(next);
    } catch (err) {
      error =
        err instanceof Error ? err.message : "An unexpected error occurred";
    } finally {
      loading = false;
    }
  }

  async function readErrorMessage(
    response: Response,
    fallback: string,
  ): Promise<string> {
    try {
      const payload = (await response.json()) as {
        error?: string | { message?: string };
      };
      const error = payload.error;
      return typeof error === "string" ? error : (error?.message ?? fallback);
    } catch {
      return fallback;
    }
  }

  async function readSignInErrorMessage(response: Response): Promise<string> {
    if (response.status === 401) {
      return "The email or password you entered is incorrect.";
    }

    return readErrorMessage(response, "Unable to sign in. Please try again.");
  }
</script>

<div class="flex flex-col gap-6">
  <div>
    <h1 class="text-2xl font-semibold tracking-tight">Sign in</h1>
    <p class="text-muted-foreground mt-1 text-sm">Welcome back to WorkIT.</p>
  </div>

  {#if error}
    <Alert.Root variant="destructive">
      <AlertCircle class="size-4" />
      <Alert.Title>Sign in failed</Alert.Title>
      <Alert.Description>{error}</Alert.Description>
    </Alert.Root>
  {/if}

  <form onsubmit={handleSubmit} class="flex flex-col gap-4">
    <div>
      <label for="email" class="text-sm font-medium">Email</label>
      <Input
        id="email"
        type="email"
        autocomplete="email"
        placeholder="you@example.com"
        bind:value={email}
        required
      />
    </div>

    <div>
      <label for="password" class="text-sm font-medium">Password</label>
      <Input
        id="password"
        type="password"
        autocomplete="current-password"
        bind:value={password}
        required
      />
    </div>

    <Button type="submit" disabled={loading}>
      {loading ? "Signing in…" : "Sign in"}
    </Button>
  </form>

  <p class="text-muted-foreground text-center text-sm">
    No account yet?
    <a
      href="/signup"
      class="text-foreground font-medium underline-offset-4 hover:underline"
    >
      Create one
    </a>
  </p>
</div>
