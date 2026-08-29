<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Models\Workspace;
use Illuminate\Http\Request;

class PageController extends Controller
{
    /** Get page tree for a workspace */
    public function index(Request $request, Workspace $workspace)
    {
        $this->checkWorkspaceAccess($request->user(), $workspace);

        $pages = Page::where('workspace_id', $workspace->id)
            ->whereNull('parent_id')
            ->where('is_archived', false)
            ->with([
                'children' => fn($q) => $q->with('children:id,uuid,title,icon,parent_id,position,type'),
                'creator:id,name,avatar',
            ])
            ->orderBy('position')
            ->get(['id', 'uuid', 'title', 'icon', 'cover', 'type', 'parent_id', 'position', 'is_favorite', 'created_by', 'updated_at']);

        return response()->json($pages);
    }

    public function store(Request $request, Workspace $workspace)
    {
        $this->checkWorkspaceAccess($request->user(), $workspace);

        $validated = $request->validate([
            'title'     => ['nullable', 'string', 'max:500'],
            'icon'      => ['nullable', 'string', 'max:50'],
            'cover'     => ['nullable', 'string'],
            'type'      => ['nullable', 'in:document,database,spreadsheet,presentation,whiteboard'],
            'parent_id' => ['nullable', 'exists:pages,id'],
        ]);

        // Calculate position (append at end of siblings)
        $maxPosition = Page::where('workspace_id', $workspace->id)
            ->where('parent_id', $validated['parent_id'] ?? null)
            ->max('position') ?? -1;

        $page = Page::create([
            ...$validated,
            'workspace_id' => $workspace->id,
            'created_by'   => $request->user()->id,
            'title'        => $validated['title'] ?? 'Untitled',
            'type'         => $validated['type'] ?? 'document',
            'position'     => $maxPosition + 1,
        ]);

        return response()->json($page->load('creator:id,name,avatar'), 201);
    }

    public function show(Request $request, Workspace $workspace, Page $page)
    {
        $this->checkPageAccess($request->user(), $workspace, $page);

        // Update last viewed
        $page->update(['last_viewed_at' => now()]);

        return response()->json(
            $page->load([
                'creator:id,name,avatar,email',
                'lastEditor:id,name,avatar',
                'children:id,uuid,title,icon,parent_id,position,type',
                'collaborators:id,name,avatar',
            ])
        );
    }

    public function update(Request $request, Workspace $workspace, Page $page)
    {
        $this->checkPageAccess($request->user(), $workspace, $page);

        $validated = $request->validate([
            'title'        => ['sometimes', 'string', 'max:500'],
            'icon'         => ['nullable', 'string', 'max:50'],
            'cover'        => ['nullable', 'string'],
            'is_favorite'  => ['sometimes', 'boolean'],
            'is_archived'  => ['sometimes', 'boolean'],
            'is_locked'    => ['sometimes', 'boolean'],
            'access'       => ['sometimes', 'in:private,workspace,public'],
            'parent_id'    => ['nullable', 'exists:pages,id'],
            'position'     => ['sometimes', 'integer', 'min:0'],
            'metadata'     => ['nullable', 'array'],
        ]);

        $page->update([
            ...$validated,
            'last_edited_by' => $request->user()->id,
        ]);

        // Broadcast page update event for real-time sync
        broadcast(new \App\Events\PageUpdated($page, $request->user()))->toOthers();

        return response()->json($page->fresh());
    }

    public function destroy(Request $request, Workspace $workspace, Page $page)
    {
        $this->checkPageAccess($request->user(), $workspace, $page);

        // Soft delete children recursively
        $this->archiveChildren($page);

        $page->delete();

        return response()->json(['message' => 'Page deleted.']);
    }

    public function archived(Request $request, Workspace $workspace)
    {
        $this->checkWorkspaceAccess($request->user(), $workspace);

        $pages = Page::onlyTrashed()
            ->where('workspace_id', $workspace->id)
            ->with('creator:id,name,avatar')
            ->latest('deleted_at')
            ->get();

        return response()->json($pages);
    }

    public function restore(Request $request, Workspace $workspace, string $uuid)
    {
        $this->checkWorkspaceAccess($request->user(), $workspace);

        $page = Page::onlyTrashed()->where('uuid', $uuid)->firstOrFail();
        $page->restore();

        return response()->json(['message' => 'Page restored.']);
    }

    /** Reorder pages within same parent */
    public function reorder(Request $request, Workspace $workspace)
    {
        $this->checkWorkspaceAccess($request->user(), $workspace);

        $validated = $request->validate([
            'pages'           => ['required', 'array'],
            'pages.*.id'      => ['required', 'exists:pages,id'],
            'pages.*.position'=> ['required', 'integer', 'min:0'],
        ]);

        foreach ($validated['pages'] as $item) {
            Page::where('id', $item['id'])
                ->where('workspace_id', $workspace->id)
                ->update(['position' => $item['position']]);
        }

        return response()->json(['message' => 'Pages reordered.']);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function checkWorkspaceAccess($user, Workspace $workspace): void
    {
        $isMember = $workspace->members()->where('user_id', $user->id)->exists();
        $isOwner  = $workspace->owner_id === $user->id;
        if (!$isMember && !$isOwner) abort(403, 'Access denied.');
    }

    private function checkPageAccess($user, Workspace $workspace, Page $page): void
    {
        $this->checkWorkspaceAccess($user, $workspace);
        if ((int)$page->workspace_id !== (int)$workspace->id) abort(404);
    }

    private function archiveChildren(Page $page): void
    {
        foreach ($page->children as $child) {
            $this->archiveChildren($child);
            $child->delete();
        }
    }
}
