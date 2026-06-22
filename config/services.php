<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'supabase' => [
        'url' => env('SUPABASE_URL', env('VITE_SUPABASE_URL', env('NEXT_PUBLIC_SUPABASE_URL'))),
        'anon_key' => env('SUPABASE_ANON_KEY', env('VITE_SUPABASE_ANON_KEY', env('NEXT_PUBLIC_SUPABASE_ANON_KEY'))),
    ],

    'invitely' => [
        'base_url' => env('INVITELY_API_BASE_URL', env('GO_API_URL')),
        'api_key' => env('INVITELY_API_KEY', env('GO_API_INTERNAL_KEY')),
        'timeout' => (int) env('INVITELY_API_TIMEOUT', env('GO_API_TIMEOUT', 30)),
    ],

];
