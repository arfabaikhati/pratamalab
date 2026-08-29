<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use Illuminate\Http\Request;

class WorkspaceController extends Controller
{
    /** List all workspaces the authenticated user belongs to */
    public function index(Request $request)
    {
        $user = $request->user();

        $workspaces = $user->workspaces()
            ->withPivot('role', 'joined_at')
            ->with('owner:id,name,avatar,email')
            ->withCount('pages')
            ->get();

        // Also include owned workspaces not already in the list
        $ownedIds    = $workspaces->pluck('id');
        $ownedExtras = $user->ownedWorkspaces()
            ->whereNotIn('id', $ownedIds)
            ->with('owner:id,name,avatar,email')
            ->withCount('pages')
            ->get();

        return response()->json($workspaces->merge($ownedExtras)->values());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'icon'        => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $workspace = Workspace::create([
            ...$validated,
            'owner_id' => $request->user()->id,
        ]);

        $workspace->members()->attach($request->user()->id, [
            'role'      => 'owner',
            'joined_at' => now(),
        ]);

        return response()->json($workspace->load('owner:id,name,avatar,email'), 201);
    }

    public function show(Request $request, Workspace $workspace)
    {
        $this->authorizeWorkspaceAccess($request->user(), $workspace);

        return response()->json(
            $workspace->load('owner:id,name,avatar,email', 'members')
                      ->loadCount('pages')
        );
    }

    public function update(Request $request, Workspace $workspace)
    {
        $this->authorizeWorkspaceOwner($request->user(), $workspace);

        $validated = $request->validate([
            'name'        => ['sometimes', 'string', 'max:255'],
            'icon'        => ['nullable', 'string', 'max:50'],
            'cover'       => ['nullable', 'string'],
            'description' => ['nullable', 'string', 'max:500'],
            'settings'    => ['nullable', 'array'],
        ]);

        $workspace->update($validated);

        return response()->json($workspace->fresh());
    }

    public function destroy(Request $request, Workspace $workspace)
    {
        $this->authorizeWorkspaceOwner($request->user(), $workspace);

        $workspace->delete();

        return response()->json(['message' => 'Workspace deleted.']);
    }

    /** List members of a workspace */
    public function members(Request $request, Workspace $workspace)
    {
        $this->authorizeWorkspaceAccess($request->user(), $workspace);

        $members = $workspace->members()->withPivot('role', 'joined_at')->get();

        return response()->json($members);
    }

    /** Invite a user to the workspace */
    public function invite(Request $request, Workspace $workspace)
    {
        $this->authorizeWorkspaceAdmin($request->user(), $workspace);

        $validated = $request->validate([
            'email' => ['required', 'email'],
            'role'  => ['required', 'in:admin,editor,viewer'],
        ]);

        $invitee = \App\Models\User::where('email', $validated['email'])->firstOrFail();

        if ($workspace->members()->where('user_id', $invitee->id)->exists()) {
            return response()->json(['message' => 'User is already a member.'], 409);
        }

        $workspace->members()->attach($invitee->id, [
            'role'      => $validated['role'],
            'joined_at' => now(),
        ]);

        return response()->json(['message' => 'Member invited successfully.']);
    }

    /** Remove a member from the workspace */
    public function removeMember(Request $request, Workspace $workspace, int $userId)
    {
        $this->authorizeWorkspaceAdmin($request->user(), $workspace);

        if ($workspace->owner_id === $userId) {
            return response()->json(['message' => 'Cannot remove the workspace owner.'], 403);
        }

        $workspace->members()->detach($userId);

        return response()->json(['message' => 'Member removed.']);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function authorizeWorkspaceAccess($user, Workspace $workspace): void
    {
        $isMember = $workspace->members()->where('user_id', $user->id)->exists();
        $isOwner  = $workspace->owner_id === $user->id;

        if (!$isMember && !$isOwner) {
            abort(403, 'Access denied.');
        }
    }

    private function authorizeWorkspaceOwner($user, Workspace $workspace): void
    {
        if ($workspace->owner_id !== $user->id) {
            abort(403, 'Only the workspace owner can perform this action.');
        }
    }

    private function authorizeWorkspaceAdmin($user, Workspace $workspace): void
    {
        $member = $workspace->members()->where('user_id', $user->id)->first();
        $isOwner = $workspace->owner_id === $user->id;
        $isAdmin = $member && in_array($member->pivot->role, ['owner', 'admin']);

        if (!$isOwner && !$isAdmin) {
            abort(403, 'Admin access required.');
        }
    }
}
