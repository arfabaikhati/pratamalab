<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Workspace extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'owner_id',
        'name',
        'slug',
        'icon',
        'cover',
        'description',
        'plan',
        'settings',
    ];

    protected $casts = [
        'settings' => 'array',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Workspace $workspace) {
            $workspace->uuid = (string) Str::uuid();
            if (empty($workspace->slug)) {
                $workspace->slug = Str::slug($workspace->name) . '-' . Str::random(6);
            }
        });
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function members()
    {
        return $this->belongsToMany(User::class, 'workspace_members')
                    ->withPivot('role', 'joined_at')
                    ->withTimestamps();
    }

    public function pages()
    {
        return $this->hasMany(Page::class);
    }

    public function rootPages()
    {
        return $this->hasMany(Page::class)->whereNull('parent_id')->where('is_archived', false);
    }
}
