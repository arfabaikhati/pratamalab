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
  pageId: number;
  pageUuid: string;
  isLocked?: boolean;
}

function useDebounce<T extends (...args: Parameters<T>) => void>(fn: T, delay: number) {
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    (...args: Parameters<T>) => {
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(() => fn(...args), delay);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fn, delay]
  );
}

export default function Editor({
  workspaceId,
  pageId,
  isLocked = false,
}: EditorProps) {
  const [isSaving, setIsSaving]   = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const initialised                = useRef(false);

  const editor = useCreateBlockNote();

  // Load blocks once
  useEffect(() => {
    if (!pageId || initialised.current) return;

    async function loadBlocks() {
      try {
        const { data } = await api.get(
          `/workspaces/${workspaceId}/pages/${pageId}/blocks`
        );
        if (data.length > 0) {
          const blocks = data.map((b: {
            uuid: string;
            type: string;
            content: unknown;
            props: unknown;
          }) => ({
            id:      b.uuid,
            type:    b.type,
            content: b.content ?? [],
            props:   b.props ?? {},
            children: [],
          }));
          editor.replaceBlocks(editor.document, blocks as BNBlock[]);
        }
      } catch {
        // empty page – fine
      }
    }

    loadBlocks();
    initialised.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId, workspaceId]);

  const saveBlocks = useCallback(
    async (blocks: BNBlock[]) => {
      if (!blocks.length) return;
      setIsSaving(true);
      try {
        const payload = blocks.map((b, idx) => ({
          uuid:            b.id,
          type:            b.type,
          content:         b.content ?? [],
          props:           b.props ?? {},
          position:        idx,
          parent_block_id: null,
        }));
        await api.post(`/workspaces/${workspaceId}/pages/${pageId}/blocks/bulk`, { blocks: payload });
        setLastSaved(new Date());
      } catch {
        toast.error("Failed to save");
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

  return (
    <div className="relative flex-1 overflow-y-auto">
      <div className="absolute top-3 right-4 text-xs text-muted z-10 select-none">
        {isSaving ? "Saving…" : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : ""}
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
