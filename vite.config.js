import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const appPort = Number(env.APP_PORT || 8080);
    const vitePort = Number(env.VITE_PORT || 5174);
    const appUrl = env.APP_URL || `http://localhost:${appPort}`;
    const viteOrigin = env.VITE_DEV_SERVER_ORIGIN || `http://localhost:${vitePort}`;
    const viteHmrHost = env.VITE_HMR_HOST || 'localhost';
    const viteCorsOrigins = (env.VITE_CORS_ORIGINS || `${appUrl},http://127.0.0.1:${appPort}`)
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

    return {
        plugins: [
            laravel({
                input: ['resources/css/app.css', 'resources/js/app.tsx'],
                refresh: true,
            }),
            react(),
            tailwindcss(),
        ],
        resolve: {
            alias: {
                '@': '/resources/js',
            },
        },
        server: {
            host: env.VITE_HOST || '0.0.0.0',
            port: vitePort,
            origin: viteOrigin,
            hmr: {
                host: viteHmrHost,
                port: vitePort,
            },
            cors: {
                origin: viteCorsOrigins,
            },
            watch: {
                ignored: ['**/storage/framework/views/**'],
            },
        },
    };
});
