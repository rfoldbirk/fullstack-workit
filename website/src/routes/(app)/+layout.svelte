<script lang="ts">
	import { onMount } from "svelte";
	import { page } from '$app/state';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import AppSidebar from '$lib/components/layout/AppSidebar.svelte';
	import HeaderUserMenu from '$lib/components/layout/HeaderUserMenu.svelte';
	import { mainNav, footerNav } from '$lib/components/layout/nav-config.js';
	import type { MeUser } from "$lib/api/types";

	let { children } = $props();
	let user: MeUser | null = $state(null);

	onMount(() => {
		const handleUserUpdated = (event: Event) => {
			user = (event as CustomEvent<MeUser>).detail;
		};

		window.addEventListener('workit:user-updated', handleUserUpdated);

		void loadUser();

		return () => {
			window.removeEventListener('workit:user-updated', handleUserUpdated);
		};
	});

	async function loadUser() {
		try {
			const response = await fetch("/api/me", {
				credentials: "include",
			});
			if (!response.ok) return;
			user = (await response.json()) as MeUser;
		} catch (err) {
		}
	}

	const currentTitle = $derived.by(() => {
		const match = [...mainNav, ...footerNav].find(
			(item) => page.url.pathname === item.href || page.url.pathname.startsWith(`${item.href}/`),
		);
		return match?.title ?? 'WorkIT';
	});
</script>

<Sidebar.Provider>
	{#if user}
		<AppSidebar {user} />
	{/if}
	<Sidebar.Inset>
		<header
			class="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur"
		>
			<Sidebar.Trigger class="-ml-1" />
			<Separator orientation="vertical" class="mx-1 h-4" />
			<h1 class="text-sm font-medium">{currentTitle}</h1>
			<div class="ml-auto">
				{#if user}
					<HeaderUserMenu {user} />
				{/if}
			</div>
		</header>
		<div class="flex-1 p-4 sm:p-6">
			{@render children()}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
