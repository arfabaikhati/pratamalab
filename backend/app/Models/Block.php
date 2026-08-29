<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Block extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'page_id',
        'created_by',
        'parent_block_id',
        'type',
        'content',
        'props',
        'position',
    ];

    protected $casts = [
        'content' => 'array',
        'props'   => 'array',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Block $block) {
            $block->uuid = (string) Str::uuid();
        });
    }

    public function page()
    {
        return $this->belongsTo(Page::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function parentBlock()
    {
        return $this->belongsTo(Block::class, 'parent_block_id');
    }

    public function children()
    {
        return $this->hasMany(Block::class, 'parent_block_id')->orderBy('position');
    }
}
