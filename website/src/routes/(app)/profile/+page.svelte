<script lang="ts">
  import { onMount } from "svelte";
  import { toast } from "svelte-sonner";
  import BadgeInfo from "@lucide/svelte/icons/badge-info";
  import GraduationCap from "@lucide/svelte/icons/graduation-cap";
  import Users from "@lucide/svelte/icons/users";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import WeightChart from "$lib/components/health/WeightChart.svelte";
  import {
    type UpdateProfileInput,
    type LogWeightInput,
  } from "$lib/validators/me";
  import type {
    CoachProfileResponse,
    MeResponse,
    WeightLogHistory,
  } from "$lib/api/types";

  let meResponse: MeResponse | null = $state(null);
  let weightLogs: WeightLogHistory | null = $state(null);
  let coachData: CoachProfileResponse | null = $state(null);
  let loading = $state(true);
  let error = $state("");

  let name = $state("");
  let email = $state("");
  let heightCm = $state<number | "">("");
  let gender = $state<"male" | "female" | "">("");
  let profileSubmitting = $state(false);

  let weight = $state<number | "">("");
  let weightSubmitting = $state(false);

  let coachPriceDkk = $state<number | "">("");
  let coachMaxClients = $state<number | "">("");
  let coachSubmitting = $state(false);

  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
  ];

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    try {
      loading = true;
      error = "";

      const [meRes, weightRes, coachRes] = await Promise.all([
        fetchJson<MeResponse>("/api/me", "Failed to load profile"),
        fetchJson<WeightLogHistory>(
          "/api/me/weight-logs",
          "Failed to load profile",
        ),
        fetchJson<CoachProfileResponse>(
          "/api/me/coach",
          "Failed to load coach profile",
        ),
      ]);

      meResponse = meRes;
      weightLogs = weightRes;
      coachData = coachRes;

      name = meRes.name ?? "";
      email = meRes.email ?? "";
      heightCm = meRes.height_cm ?? "";
      gender = meRes.gender ?? "";

      coachPriceDkk = coachRes?.myCoachProfile?.price_dkk ?? "";
      coachMaxClients = coachRes?.myCoachProfile?.max_clients ?? "";
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
        ...(heightCm === "" ? {} : { height_cm: Number(heightCm) }),
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

      const [updatedUser, updatedWeightLogs] = await Promise.all([
        fetchJson<MeResponse>("/api/me", "Failed to refresh profile"),
        fetchJson<WeightLogHistory>(
          "/api/me/weight-logs",
          "Failed to refresh weight chart",
        ),
      ]);

      meResponse = updatedUser;
      weightLogs = updatedWeightLogs;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to log weight");
    } finally {
      weightSubmitting = false;
    }
  }

  async function handleSaveCoachProfile(event: Event) {
    event.preventDefault();
    coachSubmitting = true;

    try {
      await fetchJson<CoachProfileResponse>(
        "/api/me/coach",
        "Failed to save coach profile",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            priceDkk: Number(coachPriceDkk),
            maxClients: coachMaxClients === "" ? null : Number(coachMaxClients),
          }),
        },
      );

      coachData = await fetchJson<CoachProfileResponse>(
        "/api/me/coach",
        "Failed to reload coach profile",
      );

      coachPriceDkk = coachData?.myCoachProfile?.price_dkk ?? "";
      coachMaxClients = coachData?.myCoachProfile?.max_clients ?? "";

      toast.success("Coach profile saved successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save coach profile",
      );
    } finally {
      coachSubmitting = false;
    }
  }

  async function handleDeleteCoachProfile() {
    coachSubmitting = true;

    try {
      await fetchJson("/api/me/coach", "Failed to delete coach profile", {
        method: "DELETE",
      });

      coachData = null;
      coachPriceDkk = "";
      coachMaxClients = "";

      toast.success("Coach profile removed");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete coach profile",
      );
    } finally {
      coachSubmitting = false;
    }
  }

  function formatDate(value: string): string {
    return new Date(value).toLocaleDateString();
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

    if (response.status === 204) {
      return null as T;
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
    <div class="py-8 text-center">
      <p class="text-muted-foreground">Loading profile...</p>
    </div>
  {:else if error}
    <div class="py-8 text-center">
      <p class="text-destructive">{error}</p>
    </div>
  {:else if meResponse}
    <div>
      <h1 class="text-3xl font-semibold tracking-tight">Profile</h1>
      <p class="text-muted-foreground">
        Manage your account, track your progress, and open coach availability.
      </p>
    </div>

    <div class="grid gap-6 xl:grid-cols-2">
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
              <Input id="email" type="email" bind:value={email} disabled />
            </div>

            <div>
              <label for="heightCm" class="text-sm font-medium">
                Height (cm)
              </label>
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
                  {genderOptions.find((option) => option.value === gender)
                    ?.label ?? "Select gender"}
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
              {profileSubmitting ? "Updating..." : "Update profile"}
            </Button>
          </form>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <GraduationCap class="size-5" />
            Coach Profile
          </Card.Title>
          <Card.Description>
            Make yourself available so other users can connect to you as a
            coach.
          </Card.Description>
        </Card.Header>

        <Card.Content class="flex flex-col gap-5">
          <form onsubmit={handleSaveCoachProfile} class="flex flex-col gap-4">
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label for="coachPriceDkk" class="text-sm font-medium">
                  Price (DKK)
                </label>
                <Input
                  id="coachPriceDkk"
                  type="number"
                  bind:value={coachPriceDkk}
                  min="0"
                  step="1"
                  placeholder="650"
                  required
                />
              </div>

              <div>
                <label for="coachMaxClients" class="text-sm font-medium">
                  Client limit
                </label>
                <Input
                  id="coachMaxClients"
                  type="number"
                  bind:value={coachMaxClients}
                  min="1"
                  step="1"
                  placeholder="20"
                />
              </div>
            </div>

            <div
              class="bg-muted/30 text-muted-foreground rounded-lg px-3 py-2 text-sm"
            >
              Leave the client limit empty if you want unlimited availability.
            </div>

            <div class="flex gap-3">
              <Button type="submit" disabled={coachSubmitting}>
                {coachSubmitting
                  ? "Saving..."
                  : coachData?.myCoachProfile
                    ? "Save coach profile"
                    : "Become a coach"}
              </Button>

              {#if coachData?.myCoachProfile}
                <Button
                  type="button"
                  variant="destructive"
                  disabled={coachSubmitting}
                  onclick={handleDeleteCoachProfile}
                >
                  Remove coach profile
                </Button>
              {/if}
            </div>
          </form>

          {#if coachData?.myCoachProfile}
            <div class="border-border grid gap-4 border-t pt-4 sm:grid-cols-3">
              <div>
                <div class="text-muted-foreground text-xs uppercase">Rate</div>
                <div class="text-lg font-semibold">
                  {coachData.myCoachProfile.price_dkk} DKK
                </div>
              </div>

              <div>
                <div class="text-muted-foreground text-xs uppercase">
                  Clients
                </div>
                <div class="text-lg font-semibold">—</div>
              </div>

              <div>
                <div class="text-muted-foreground text-xs uppercase">
                  Capacity
                </div>
                <div class="text-lg font-semibold">
                  {coachData.myCoachProfile.max_clients ?? "Unlimited"}
                </div>
              </div>
            </div>
          {:else}
            <div
              class="border-border bg-muted/20 flex items-start gap-3 rounded-lg border p-4 text-sm"
            >
              <BadgeInfo class="text-muted-foreground mt-0.5 size-4 shrink-0" />
              <p class="text-muted-foreground">
                Once you save this form, your coach profile becomes available to
                other users.
              </p>
            </div>
          {/if}
        </Card.Content>
      </Card.Root>
    </div>

    <div class="grid gap-6 xl:grid-cols-2">
      <Card.Root>
        <Card.Header>
          <Card.Title>Weight Log</Card.Title>
          <Card.Description>
            Log your latest weight and keep your entries up to date.
          </Card.Description>
        </Card.Header>

        <Card.Content class="flex flex-col gap-6">
          <form onsubmit={handleLogWeight} class="flex flex-col gap-4">
            <div>
              <label for="weight" class="text-sm font-medium">
                Weight (kg)
              </label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                bind:value={weight}
                placeholder="?"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={weightSubmitting}
              class="self-start"
            >
              {weightSubmitting ? "Logging..." : "Log weight"}
            </Button>
          </form>

          <div class="grid gap-3 sm:grid-cols-2">
            <div class="border-border rounded-lg border p-4">
              <div class="text-muted-foreground text-xs uppercase">Current</div>
              <div class="mt-1 text-2xl font-semibold">
                {meResponse.weight_kg !== null
                  ? `${meResponse.weight_kg} kg`
                  : "—"}
              </div>
            </div>

            <div class="border-border rounded-lg border p-4">
              <div class="text-muted-foreground text-xs uppercase">Entries</div>
              <div class="mt-1 text-2xl font-semibold">
                {weightLogs?.length ?? 0}
              </div>
            </div>
          </div>

          {#if weightLogs && weightLogs.length > 0}
            <div class="border-border border-t pt-4">
              <h4 class="mb-3 text-sm font-medium">Recent entries</h4>

              <div class="space-y-2">
                {#each weightLogs.slice(0, 5) as log (log.timestamp)}
                  <div class="flex justify-between gap-3 text-sm">
                    <span class="text-muted-foreground">
                      {formatDate(log.timestamp)}
                    </span>
                    <span class="font-medium">
                      {log.weight !== null ? `${log.weight} kg` : "—"}
                    </span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title>Weight Chart</Card.Title>
          <Card.Description>
            Follow your weight trend over time.
          </Card.Description>
        </Card.Header>

        <Card.Content>
          <WeightChart
            entries={weightLogs ?? []}
            emptyLabel="Log your first weight entry to start the chart."
          />
        </Card.Content>
      </Card.Root>
    </div>
  {/if}
</div>
