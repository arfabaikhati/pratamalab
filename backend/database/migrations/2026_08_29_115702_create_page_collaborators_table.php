<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tracks who is currently editing a page (for live presence indicators)
        Schema::create('page_collaborators', function (Blueprint $table) {
            $table->id();
            $table->foreignId('page_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('permission', ['view', 'comment', 'edit', 'full'])->default('edit');
            $table->json('cursor')->nullable();    // real-time cursor position
            $table->timestamp('active_at')->nullable();
            $table->timestamps();

            $table->unique(['page_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_collaborators');
    }
};
