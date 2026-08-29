<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('last_edited_by')->nullable()->constrained('users');
            $table->foreignId('parent_id')->nullable()->constrained('pages')->nullOnDelete();
            $table->string('title')->default('Untitled');
            $table->string('icon')->nullable();   // emoji or image URL
            $table->string('cover')->nullable();  // cover image URL
            $table->enum('type', ['document', 'database', 'spreadsheet', 'presentation', 'whiteboard'])->default('document');
            $table->boolean('is_template')->default(false);
            $table->boolean('is_favorite')->default(false);
            $table->boolean('is_archived')->default(false);
            $table->boolean('is_locked')->default(false);
            $table->enum('access', ['private', 'workspace', 'public'])->default('workspace');
            $table->integer('position')->default(0);  // ordering among siblings
            $table->json('metadata')->nullable();     // extra settings per page type
            $table->timestamp('last_viewed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['workspace_id', 'parent_id', 'is_archived']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pages');
    }
};
