<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
        'bio',
        'timezone',
        'preferences',
        'last_seen_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_seen_at'      => 'datetime',
        'preferences'       => 'array',
        'password'          => 'hashed',
    ];

    public function ownedWorkspaces()
    {
        return $this->hasMany(Workspace::class, 'owner_id');
    }

    public function workspaces()
    {
        return $this->belongsToMany(Workspace::class, 'workspace_members')
                    ->withPivot('role', 'joined_at')
                    ->withTimestamps();
    }

    public function pages()
    {
        return $this->hasMany(Page::class, 'created_by');
    }
}
