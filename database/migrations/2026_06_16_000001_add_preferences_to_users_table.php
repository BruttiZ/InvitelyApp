<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->json('settings')->nullable()->after('role');
            $table->json('notification_preferences')->nullable()->after('settings');
            $table->json('privacy_preferences')->nullable()->after('notification_preferences');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['settings', 'notification_preferences', 'privacy_preferences']);
        });
    }
};
