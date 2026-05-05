<script lang="ts">
	import { mode, setMode } from 'mode-watcher';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Moon from '@lucide/svelte/icons/moon';
	import Sun from '@lucide/svelte/icons/sun';
	import UserCircle from '@lucide/svelte/icons/user-circle';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import type { MeUser } from '$lib/api/types';
	import { getInitials, profilePictureSrc } from '$lib/profile-picture';

	type Props = { user: MeUser };
	let { user }: Props = $props();

	const initials = $derived(getInitials(user.name));
	const avatarSrc = $derived(profilePictureSrc(user.picture));
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button
				variant="ghost"
				size="icon"
				class="rounded-full"
				aria-label="Open user menu"
				{...props}
			>
				<Avatar.Root class="size-8">
					{#if avatarSrc}
						<Avatar.Image src={avatarSrc} alt={user.name} />
					{/if}
					<Avatar.Fallback>{initials || 'U'}</Avatar.Fallback>
				</Avatar.Root>
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>

	<DropdownMenu.Content class="w-64 rounded-lg" side="bottom" align="end" sideOffset={8}>
		<DropdownMenu.Label class="p-0 font-normal">
			<div class="flex items-center gap-3 px-2 py-2 text-left text-sm">
				<Avatar.Root class="size-10">
					{#if avatarSrc}
						<Avatar.Image src={avatarSrc} alt={user.name} />
					{/if}
					<Avatar.Fallback>{initials || 'U'}</Avatar.Fallback>
				</Avatar.Root>
				<div class="grid min-w-0 flex-1 leading-tight">
					<span class="truncate font-medium">{user.name}</span>
					<span class="text-muted-foreground truncate text-xs">{user.email}</span>
				</div>
			</div>
		</DropdownMenu.Label>
		<DropdownMenu.Separator />
		<DropdownMenu.Item>
			{#snippet child({ props })}
				<a href="/profile" {...props}>
					<UserCircle class="size-4" />
					Profile
				</a>
			{/snippet}
		</DropdownMenu.Item>
		<DropdownMenu.Item onSelect={() => setMode(mode.current === 'dark' ? 'light' : 'dark')}>
			{#if mode.current === 'dark'}
				<Sun class="size-4" />
				Light mode
			{:else}
				<Moon class="size-4" />
				Dark mode
			{/if}
		</DropdownMenu.Item>
		<DropdownMenu.Separator />
		<DropdownMenu.Item>
			{#snippet child({ props })}
				<a href="/signout" {...props}>
					<LogOut class="size-4" />
					Sign out
				</a>
			{/snippet}
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
