<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as InputOTP from '$lib/components/ui/input-otp/index.js';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	let step = $state<'request' | 'verify'>('request');
	let error = $state('');
	let loading = $state(false);
	let fullName = $state('');
	let email = $state('');
	let password = $state('');
	let otp = $state('');

	async function handleRequestSubmit(event: Event) {
		event.preventDefault();
		error = '';
		loading = true;

		try {
			const response = await fetch('/api/auth/signup', {
				method: 'POST',
				headers: {
					'content-type': 'application/json',
				},
				body: JSON.stringify({ fullName, email, password }),
				credentials: 'include',
			});
			if (!response.ok) {
				throw new Error(await readErrorMessage(response, 'An unexpected error occurred'));
			}
			step = 'verify';
		} catch (err) {
			error = err instanceof Error ? err.message : 'An unexpected error occurred';
		} finally {
			loading = false;
		}
	}

	async function handleVerifySubmit(event: Event) {
		event.preventDefault();
		error = '';
		loading = true;

		try {
			const response = await fetch('/api/auth/signup/verify', {
				method: 'POST',
				headers: {
					'content-type': 'application/json',
				},
				body: JSON.stringify({ fullName, email, password, otp }),
				credentials: 'include',
			});
			if (!response.ok) {
				throw new Error(await readErrorMessage(response, 'An unexpected error occurred'));
			}
			goto('/dashboard');
		} catch (err) {
			error = err instanceof Error ? err.message : 'An unexpected error occurred';
		} finally {
			loading = false;
		}
	}

	function backToRequest() {
		step = 'request';
		error = '';
	}

	async function readErrorMessage(response: Response, fallback: string): Promise<string> {
		try {
			const payload = (await response.json()) as {
				error?: string | { message?: string };
			};
			const error = payload.error;
			return typeof error === 'string' ? error : (error?.message ?? fallback);
		} catch {
			return fallback;
		}
	}
</script>

<div class="flex flex-col gap-6">
	<div>
		{#if step === 'request'}
			<h1 class="text-2xl font-semibold tracking-tight">Create account</h1>
			<p class="text-muted-foreground mt-1 text-sm">
				Sign up and we'll send a verification code to your email.
			</p>
		{:else}
			<button
				type="button"
				onclick={backToRequest}
				class="text-muted-foreground hover:text-foreground mb-1 inline-flex items-center gap-1 text-xs"
			>
				<ArrowLeft class="size-3" />
				Back
			</button>
			<h1 class="text-2xl font-semibold tracking-tight">Check your email</h1>
			<p class="text-muted-foreground mt-1 text-sm">
				We sent a 6-digit code to <span class="font-medium">{email}</span>.
			</p>
		{/if}
	</div>

	{#if step === 'request'}
		{#if error}
			<Alert.Root variant="destructive">
				<AlertCircle class="size-4" />
				<Alert.Title>Signup failed</Alert.Title>
				<Alert.Description>{error}</Alert.Description>
			</Alert.Root>
		{/if}

		<form onsubmit={handleRequestSubmit} class="flex flex-col gap-4">
			<div>
				<label for="fullName" class="text-sm font-medium">Full name</label>
				<Input id="fullName" autocomplete="name" bind:value={fullName} required />
			</div>

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
					autocomplete="new-password"
					bind:value={password}
					required
				/>
				<p class="text-muted-foreground mt-1 text-xs">
					At least 8 characters with an uppercase letter, a lowercase letter, and a number.
				</p>
			</div>

			<Button type="submit" disabled={loading}>
				{loading ? 'Sending code...' : 'Send verification code'}
			</Button>
		</form>
	{:else}
		{#if error}
			<Alert.Root variant="destructive">
				<AlertCircle class="size-4" />
				<Alert.Title>Verification failed</Alert.Title>
				<Alert.Description>{error}</Alert.Description>
			</Alert.Root>
		{/if}

		<form onsubmit={handleVerifySubmit} class="flex flex-col gap-6">
			<div>
				<InputOTP.Root
					maxlength={6}
					bind:value={otp}
					inputmode="numeric"
					autocomplete="one-time-code"
					aria-label="Verification code"
					class="justify-center"
				>
					{#snippet children({ cells })}
						<InputOTP.Group>
							{#each cells.slice(0, 3) as cell, i (i)}
								<InputOTP.Slot {cell} />
							{/each}
						</InputOTP.Group>
						<InputOTP.Separator />
						<InputOTP.Group>
							{#each cells.slice(3, 6) as cell, i (i)}
								<InputOTP.Slot {cell} />
							{/each}
						</InputOTP.Group>
					{/snippet}
				</InputOTP.Root>
			</div>

			<Button type="submit" disabled={loading || otp.length !== 6}>
				{loading ? 'Verifying...' : 'Verify and create account'}
			</Button>
		</form>
	{/if}

	<p class="text-muted-foreground text-center text-sm">
		Already have an account?
		<a href="/signin" class="text-foreground font-medium underline-offset-4 hover:underline">
			Sign in
		</a>
	</p>
</div>