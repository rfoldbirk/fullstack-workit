import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const apiTarget = env.API_PROXY_TARGET ?? 'http://localhost:4000';

	return {
		server: {
			port: 3000,
			strictPort: true,
			proxy: {
				'/api': {
					target: apiTarget,
					changeOrigin: false,
				},
			},
		},
		preview: {
			port: 3000,
			allowedHosts: ['goworkit.tech'],
		},
		plugins: [tailwindcss(), sveltekit()],
	};
});
