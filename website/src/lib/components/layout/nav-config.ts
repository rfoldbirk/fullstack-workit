import House from '@lucide/svelte/icons/house';
import Users from '@lucide/svelte/icons/users';
import GraduationCap from '@lucide/svelte/icons/graduation-cap';
import Dumbbell from '@lucide/svelte/icons/dumbbell';
import BicepsFlexed from '@lucide/svelte/icons/biceps-flexed';
import Settings from '@lucide/svelte/icons/settings';
import type { Component } from 'svelte';

export type NavItem = {
	title: string;
	href: string;
	icon: Component;
};

export const mainNav: NavItem[] = [
	{ title: 'Dashboard', href: '/dashboard', icon: House },
	{ title: 'Clients', href: '/clients', icon: Users },
	{ title: 'Coach', href: '/trainer', icon: GraduationCap },
	{ title: 'Workouts', href: '/workouts', icon: Dumbbell },
];

export const footerNav: NavItem[] = [{ title: 'Settings', href: '/profile', icon: Settings }];
