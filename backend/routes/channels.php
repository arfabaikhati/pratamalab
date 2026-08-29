<?php

use App\Models\Page;
use App\Models\Workspace;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
*/

// Workspace channel — any member can join
Broadcast::channel('workspace.{workspaceUuid}', function ($user, string $workspaceUuid) {
    $workspace = Workspace::where('uuid', $workspaceUuid)->first();
    if (!$workspace) return false;

    $isMember = $workspace->members()->where('user_id', $user->id)->exists();
    $isOwner  = $workspace->owner_id === $user->id;

    if (!$isMember && !$isOwner) return false;

    return [
        'id'     => $user->id,
        'name'   => $user->name,
        'avatar' => $user->avatar,
    ];
});

// Page presence channel — workspace members can join
Broadcast::channel('page.{pageUuid}', function ($user, string $pageUuid) {
    $page = Page::where('uuid', $pageUuid)->with('workspace')->first();
    if (!$page) return false;

    $workspace = $page->workspace;
    $isMember  = $workspace->members()->where('user_id', $user->id)->exists();
    $isOwner   = $workspace->owner_id === $user->id;

    if (!$isMember && !$isOwner) return false;

    return [
        'id'     => $user->id,
        'name'   => $user->name,
        'avatar' => $user->avatar,
    ];
});
