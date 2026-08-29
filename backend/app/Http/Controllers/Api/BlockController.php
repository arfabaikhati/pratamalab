<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Block;
use App\Models\Page;
use App\Models\Workspace;
use Illuminate\Http\Request;

class BlockController extends Controller
{
    /** Get all blocks for a page (flat list, client builds tree) */
    public function index(Request $request, Workspace $workspace, Page $page)
    {
        $this->checkAccess($request->user(), $workspace, $page);

        $blocks = Block::where('page_id', $page->id)
            ->orderBy('position')
            ->get();

        return response()->json($blocks);
    }

    /** Bulk-save blocks (entire page state from editor) */
    public function bulkSave(Request $request, Workspace $workspace, Page $page)
    {
        $this->checkAccess($request->user(), $workspace, $page);

        $validated = $request->validate([
            'blocks'                  => ['required', 'array'],
            'blocks.*.uuid'           => ['required', 'string'],
            'blocks.*.type'           => ['required', 'string'],
            'blocks.*.content'        => ['nullable', 'array'],
            'blocks.*.props'          => ['nullable', 'array'],
            'blocks.*.position'       => ['required', 'integer'],
            'blocks.*.parent_block_id'=> ['nullable', 'exists:blocks,id'],
        ]);

        // Delete blocks no longer present
        $incomingUuids = collect($validated['blocks'])->pluck('uuid');
        Block::where('page_id', $page->id)
             ->whereNotIn('uuid', $incomingUuids)
             ->delete();

        foreach ($validated['blocks'] as $blockData) {
            Block::updateOrCreate(
                ['uuid' => $blockData['uuid']],
                [
                    'page_id'         => $page->id,
                    'created_by'      => $request->user()->id,
                    'type'            => $blockData['type'],
                    'content'         => $blockData['content'] ?? null,
                    'props'           => $blockData['props'] ?? null,
                    'position'        => $blockData['position'],
                    'parent_block_id' => $blockData['parent_block_id'] ?? null,
                ]
            );
        }

        // Update page last_edited_by
        $page->update(['last_edited_by' => $request->user()->id]);

        // Broadcast change to collaborators
        broadcast(new \App\Events\BlocksUpdated($page, $request->user()))->toOthers();

        return response()->json(['message' => 'Blocks saved.', 'count' => count($validated['blocks'])]);
    }

    public function store(Request $request, Workspace $workspace, Page $page)
    {
        $this->checkAccess($request->user(), $workspace, $page);

        $validated = $request->validate([
            'type'            => ['required', 'string'],
            'content'         => ['nullable', 'array'],
            'props'           => ['nullable', 'array'],
            'position'        => ['required', 'integer', 'min:0'],
            'parent_block_id' => ['nullable', 'exists:blocks,id'],
        ]);

        $block = Block::create([
            ...$validated,
            'page_id'    => $page->id,
            'created_by' => $request->user()->id,
        ]);

        broadcast(new \App\Events\BlocksUpdated($page, $request->user()))->toOthers();

        return response()->json($block, 201);
    }

    public function update(Request $request, Workspace $workspace, Page $page, Block $block)
    {
        $this->checkAccess($request->user(), $workspace, $page);

        $validated = $request->validate([
            'type'            => ['sometimes', 'string'],
            'content'         => ['nullable', 'array'],
            'props'           => ['nullable', 'array'],
            'position'        => ['sometimes', 'integer', 'min:0'],
            'parent_block_id' => ['nullable', 'exists:blocks,id'],
        ]);

        $block->update($validated);
        $page->update(['last_edited_by' => $request->user()->id]);

        broadcast(new \App\Events\BlocksUpdated($page, $request->user()))->toOthers();

        return response()->json($block->fresh());
    }

    public function destroy(Request $request, Workspace $workspace, Page $page, Block $block)
    {
        $this->checkAccess($request->user(), $workspace, $page);

        // Delete children blocks first
        Block::where('parent_block_id', $block->id)->delete();
        $block->delete();

        broadcast(new \App\Events\BlocksUpdated($page, $request->user()))->toOthers();

        return response()->json(['message' => 'Block deleted.']);
    }

    // ─── Helper ──────────────────────────────────────────────────────────────

    private function checkAccess($user, Workspace $workspace, Page $page): void
    {
        $isMember = $workspace->members()->where('user_id', $user->id)->exists();
        $isOwner  = $workspace->owner_id === $user->id;
        if (!$isMember && !$isOwner) abort(403, 'Access denied.');
        if ((int)$page->workspace_id !== (int)$workspace->id) abort(404);
    }
}
