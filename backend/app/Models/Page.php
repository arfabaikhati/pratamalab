<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Page extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'workspace_id',
        'created_by',
        'last_edited_by',
        'parent_id',
        'title',
        'icon',
        'cover',
        'type',
        'is_template',
        'is_favorite',
        'is_archived',
        'is_locked',
        'access',
        'position',
        'metadata',
        'last_viewed_at',
    ];

    protected $casts = [
        'is_template'    => 'boolean',
        'is_favorite'    => 'boolean',
        'is_archived'    => 'boolean',
        'is_locked'      => 'boolean',
        'metadata'       => 'array',
        'last_viewed_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Page $page) {
            $page->uuid = (string) Str::uuid();
        });
    }

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function lastEditor()
    {
        return $this->belongsTo(User::class, 'last_edited_by');
    }

    public function parent()
    {
        return $this->belongsTo(Page::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Page::class, 'parent_id')
                    ->where('is_archived', false)
                    ->orderBy('position');
    }

    public function blocks()
    {
        return $this->hasMany(Block::class)->whereNull('parent_block_id')->orderBy('position');
    }

    public function allBlocks()
    {
        return $this->hasMany(Block::class)->orderBy('position');
    }

    public function collaborators()
    {
        return $this->belongsToMany(User::class, 'page_collaborators')
                    ->withPivot('permission', 'cursor', 'active_at')
                    ->withTimestamps();
    }
}
