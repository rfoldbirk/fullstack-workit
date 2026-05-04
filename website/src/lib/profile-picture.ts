export function getInitials(name: string): string {
	return name
		.trim()
		.split(/\s+/)
		.map((part) => part[0]?.toUpperCase() ?? '')
		.slice(0, 2)
		.join('');
}

export function profilePictureSrc(picture: string | null | undefined, cacheKey?: string | number) {
	if (!picture) {
		return null;
	}

	if (!cacheKey) {
		return picture;
	}

	const separator = picture.includes('?') ? '&' : '?';
	return `${picture}${separator}v=${encodeURIComponent(String(cacheKey))}`;
}
