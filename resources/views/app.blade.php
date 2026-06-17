<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="theme-color" content="#020617">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-title" content="{{ config('app.name', 'Invitely') }}">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="description" content="Invitely is an open source digital invitation and event RSVP platform.">
        <meta property="og:title" content="{{ config('app.name', 'Invitely') }}">
        <meta property="og:type" content="website">
        <meta property="og:description" content="Premium digital invitations, RSVP, QR check-in and event analytics.">
        <meta property="og:image" content="/og-image.svg">
        <meta name="twitter:card" content="summary_large_image">
        <title>{{ config('app.name', 'Invitely') }}</title>
        <link rel="manifest" href="/manifest.webmanifest">
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800" rel="stylesheet" />
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
    </head>
    <body>
        <div id="root"></div>
        <script>
            if ('serviceWorker' in navigator && {{ app()->environment('production') ? 'true' : 'false' }}) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
                });
            } else if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations()
                    .then((registrations) => registrations.forEach((registration) => registration.unregister()))
                    .catch(() => {});

                if ('caches' in window) {
                    caches.keys()
                        .then((keys) => keys.forEach((key) => caches.delete(key)))
                        .catch(() => {});
                }
            }
        </script>
    </body>
</html>
