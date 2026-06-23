<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        if (! $this->shouldSeedDemoData()) {
            $this->command?->warn('Demo seed skipped. Enable INVITELY_SEED_DEMO=true outside local/testing.');

            return;
        }

        $this->call(DemoSeeder::class);
    }

    private function shouldSeedDemoData(): bool
    {
        $enabled = filter_var(env('INVITELY_SEED_DEMO', app()->environment(['local', 'testing'])), FILTER_VALIDATE_BOOL);

        if (! $enabled) {
            return false;
        }

        if (app()->environment(['local', 'testing'])) {
            return true;
        }

        return filter_var(env('INVITELY_ALLOW_NON_LOCAL_SEEDING', false), FILTER_VALIDATE_BOOL);
    }
}
