import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
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
        host: '0.0.0.0',
        port: 5174,
        origin: 'http://localhost:5174',
        hmr: {
            host: 'localhost',
            port: 5174,
        },
        cors: {
            origin: [
                'http://localhost:8082',
                'http://127.0.0.1:8082',
            ],
        },
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
