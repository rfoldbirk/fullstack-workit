<script lang="ts">
  import { onMount } from "svelte";
  import { toast } from "svelte-sonner";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import {
    type UpdateProfileInput,
    type LogWeightInput,
  } from "$lib/validators/me";
  import type { MeResponse, WeightLogHistory } from "$lib/api/types";

  let meResponse: MeResponse | null = $state(null);
  let weightLogs: WeightLogHistory | null = $state(null);
  let loading = $state(true);
  let error = $state("");

  let name = $state("");
  let email = $state("");
  let heightCm = $state<number | "">("");
  let gender = $state<"male" | "female" | "">("");
  let profileSubmitting = $state(false);

  let weight = $state<number | "">("");
  let weightSubmitting = $state(false);

  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
  ];

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    try {
      const [meRes, weightRes] = await Promise.all([
        fetchJson<MeResponse>("/api/me", "Failed to load profile"),
        fetchJson<WeightLogHistory>(
          "/api/me/weight-logs",
          "Failed to load profile",
        ),
      ]);
      meResponse = meRes;
      weightLogs = weightRes;

      const user = meResponse;
      name = user.name;
      email = user.email;
      heightCm = user.height_cm ?? "";
      gender = user.gender ?? "";
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load profile";
    } finally {
      loading = false;
    }
  }

  async function handleUpdateProfile(event: Event) {
    event.preventDefault();
    profileSubmitting = true;

    try {
      const data: UpdateProfileInput = {
        name,
        ...(heightCm === "" ? {} : { heightCm: Number(heightCm) }),
        ...(gender ? { gender } : {}),
      };

      const response = await fetchJson<MeResponse>(
        "/api/me",
        "Failed to update profile",
        {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(data),
        },
      );
      meResponse = response;
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile",
      );
    } finally {
      profileSubmitting = false;
    }
  }

  async function handleLogWeight(event: Event) {
    event.preventDefault();
    weightSubmitting = true;

    try {
      const data: LogWeightInput = {
        weight: Number(weight),
      };

      await fetchJson("/api/me/weight-logs", "Failed to log weight", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(data),
      });

      toast.success("Weight logged successfully");
      weight = "";

      const weightRes = await fetchJson<WeightLogHistory>(
        "/api/me/weight-logs",
        "Failed to log weight",
      );
      weightLogs = weightRes;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to log weight");
    } finally {
      weightSubmitting = false;
    }
  }

  async function fetchJson<T>(
    url: string,
    fallback: string,
    init?: RequestInit,
  ): Promise<T> {
    const response = await fetch(url, {
      ...init,
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, fallback));
    }
    return (await response.json()) as T;
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
</script>

<div class="flex flex-col gap-6">
  {#if loading}
    <div class="text-center py-8">
      <p class="text-muted-foreground">Loading profile...</p>
    </div>
  {:else if error}
    <div class="text-center py-8">
      <p class="text-destructive">{error}</p>
    </div>
  {:else if meResponse}
    <div>
      <h1 class="text-3xl font-semibold tracking-tight">Profile</h1>
      <p class="text-muted-foreground">
        Manage your account settings and track your progress.
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <Card.Root>
        <Card.Header>
          <Card.Title>Personal Information</Card.Title>
          <Card.Description>Update your personal details.</Card.Description>
        </Card.Header>
        <Card.Content>
          <form onsubmit={handleUpdateProfile} class="flex flex-col gap-4">
            <div>
              <label for="name" class="text-sm font-medium">Full name</label>
              <Input id="name" bind:value={name} required />
            </div>

            <div>
              <label for="email" class="text-sm font-medium">Email</label>
              <Input id="email" type="email" bind:value={email} required />
            </div>

            <div>
              <label for="heightCm" class="text-sm font-medium"
                >Height (cm)</label
              >
              <Input
                id="heightCm"
                type="number"
                bind:value={heightCm}
                min="1"
                max="300"
              />
            </div>

            <div>
              <label for="gender" class="text-sm font-medium">Gender</label>
              <Select.Root type="single" bind:value={gender}>
                <Select.Trigger class="w-full">
                  {genderOptions.find((g) => g.value === gender)?.label ??
                    "Select gender"}
                </Select.Trigger>
                <Select.Content>
                  {#each genderOptions as option (option.value)}
                    <Select.Item value={option.value} label={option.label}>
                      {option.label}
                    </Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
            </div>

            <Button
              type="submit"
              disabled={profileSubmitting}
              class="self-start"
            >
              {profileSubmitting ? "Updating…" : "Update profile"}
            </Button>
          </form>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title>Weight Tracking</Card.Title>
          <Card.Description>Log your current weight.</Card.Description>
        </Card.Header>
        <Card.Content>
          <form onsubmit={handleLogWeight} class="flex flex-col gap-4">
            <div>
              <label for="weight" class="text-sm font-medium">Weight (kg)</label
              >
              <Input
                id="weight"
                type="number"
                step="0.1"
                bind:value={weight}
                placeholder="70.5"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={weightSubmitting}
              class="self-start"
            >
              {weightSubmitting ? "Logging…" : "Log weight"}
            </Button>
          </form>

          {#if weightLogs && weightLogs.length > 0}
            <div class="border-border mt-6 border-t pt-6">
              <h4 class="text-sm font-medium mb-3">Recent entries</h4>
              <div class="space-y-2">
                {#each weightLogs.slice(0, 5) as log (log.timestamp)}
                  <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                    <span class="font-medium">{log.weight} kg</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </Card.Content>
      </Card.Root>
    </div>
  {/if}
</div>
