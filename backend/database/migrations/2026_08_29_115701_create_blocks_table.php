<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blocks', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('page_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('parent_block_id')->nullable()->constrained('blocks')->nullOnDelete();
            /*
             * Block types (Notion-like):
             * paragraph, heading_1, heading_2, heading_3,
             * bulleted_list, numbered_list, todo, toggle,
             * code, quote, callout, divider,
             * image, video, file, audio, embed,
             * table, table_row,
             * equation (KaTeX),
             * column_list, column,
             * linked_to_page, child_page, child_database,
             * breadcrumb, template, synced_block
             */
            $table->string('type')->default('paragraph');
            $table->json('content')->nullable();   // rich text / data payload
            $table->json('props')->nullable();     // styling, color, checked, level, etc.
            $table->integer('position')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['page_id', 'parent_block_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blocks');
    }
};
