"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import type { Block as BNBlock } from "@blocknote/core";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface EditorProps {
  workspaceId: number;
  pageId:      number;
  pageUuid:    string;
  isLocked?:   boolean;
}

// ── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce<T extends unknown[]>(
  fn: (...args: T) => void,
  delay: number
): (...args: T) => void {
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep a stable ref to fn so we don't need fn in dep array
  const fnRef = useRef(fn);
  useEffect(() => { fnRef.current = fn; });

  return useCallback(
    (...args: T) => {
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(() => fnRef.current(...args), delay);
    },
    [delay]
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Editor({
  workspaceId,
  pageId,
  isLocked = false,
}: EditorProps) {
  const [isSaving, setIsSaving]   = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [loadError, setLoadError] = useState(false);
  const initialised               = useRef(false);

  const editor = useCreateBlockNote();

  // ── Load blocks once on mount ───────────────────────────────────────────────
  useEffect(() => {
    // Reset when pageId changes (navigating between pages)
    initialised.current = false;
    setLoadError(false);
  }, [pageId]);

  useEffect(() => {
    if (!pageId || initialised.current) return;
    initialised.current = true;

    async function loadBlocks() {
      try {
        const { data } = await api.get(
          `/workspaces/${workspaceId}/pages/${pageId}/blocks`
        );

        if (Array.isArray(data) && data.length > 0) {
          const blocks: BNBlock[] = data.map((b: {
            uuid:    string;
            type:    string;
            content: unknown;
            props:   unknown;
          }) => ({
            id:       b.uuid,
            type:     b.type,
            content:  Array.isArray(b.content) ? b.content : [],
            props:    (b.props && typeof b.props === "object") ? b.props : {},
            children: [],
          }) as unknown as BNBlock);

          editor.replaceBlocks(editor.document, blocks);
        }
      } catch (err) {
        // 404 = new page with no blocks yet — that's fine, keep empty editor
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status && status !== 404) {
          setLoadError(true);
          toast.error("Failed to load page content");
        }
      }
    }

    loadBlocks();
  }, [pageId, workspaceId, editor]);

  // ── Save ────────────────────────────────────────────────────────────────────
  const saveBlocks = useCallback(
    async (blocks: BNBlock[]) => {
      if (!blocks.length) return;
      setIsSaving(true);
      try {
        const payload = blocks.map((b, idx) => ({
          uuid:            b.id,
          type:            b.type,
          content:         b.content  ?? [],
          props:           b.props    ?? {},
          position:        idx,
          parent_block_id: null,
        }));

        await api.post(
          `/workspaces/${workspaceId}/pages/${pageId}/blocks/bulk`,
          { blocks: payload }
        );
        setLastSaved(new Date());
      } catch {
        toast.error("Failed to save — changes may be lost");
      } finally {
        setIsSaving(false);
      }
    },
    [workspaceId, pageId]
  );

  const debouncedSave = useDebounce(saveBlocks, 1500);

  function handleChange() {
    if (isLocked) return;
    debouncedSave(editor.document as unknown as BNBlock[]);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)]">
        <p>Failed to load content. Try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-y-auto min-h-0">
      {/* Save indicator */}
      <div className="absolute top-3 right-4 text-xs text-[var(--text-muted)] z-10 select-none pointer-events-none">
        {isSaving
          ? "Saving…"
          : lastSaved
          ? `Saved ${lastSaved.toLocaleTimeString()}`
          : ""}
      </div>

      <div className={isLocked ? "pointer-events-none opacity-70" : ""}>
        <BlockNoteView
          editor={editor}
          onChange={handleChange}
          theme="light"
        />
      </div>
    </div>
  );
}
