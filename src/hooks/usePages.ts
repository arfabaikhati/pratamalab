import { useCallback, useEffect, useRef, useState } from "react";
import type { Block, BlockType, Page, Profile, Workspace } from "../types";
import {
  fetchPages, fetchPageBlocks, createPage as dbCreatePage,
  updatePage as dbUpdatePage, softDeletePage, upsertBlocks,
  deleteBlock as dbDeleteBlock, saveLocal, loadLocal,
} from "../lib/db";
import { subscribeToPageChanges } from "../lib/supabase";
import { isOfflineMode } from "../lib/supabase";
import { uid, escapeHtml, stripHtml, CALLOUT_ICONS, PAGE_ICONS, randomFrom } from "../lib/util";
import { makeSeed } from "../data/seed";

// ─── Block factory ──────────────────────────────────────────
export function mkBlock(type: BlockType, pageId: string, sortOrder = 0): Block {
  return {
    id: uid(),
    page_id: pageId,
    type,
    html: "",
    sort_order: sortOrder,
    v: 0,
    ...(type === "todo"    ? { checked: false } : {}),
    ...(type === "table"   ? { rows: [["","",""],["","",""],["",""," "]] } : {}),
    ...(type === "callout" ? { icon: "💡" } : {}),
    ...(type === "code"    ? { lang: "js" } : {}),
    ...(type === "image"   ? { props: { url: "", caption: "" } } : {}),
    ...(type === "embed"   ? { props: { url: "" } } : {}),
    ...(type === "toggle"  ? { props: { open: false } } : {}),
  };
}

type SaveStatus = "saved" | "saving" | "error";

export function usePages(profile: Profile | null, workspace: Workspace | null) {
  const [pages, setPages] = useState<Page[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [loading, setLoading] = useState(true);

  const saveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const realtimeSubs = useRef<Map<string, () => void>>(new Map());

  // ── Initial load ──────────────────────────────────────────

  useEffect(() => {
    if (!profile || !workspace) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        let loaded = await fetchPages(workspace.id);

        // First run: seed demo data
        if (loaded.length === 0 && isOfflineMode()) {
          const { pages: seeded } = makeSeed(workspace.id, profile.id);
          saveLocal(seeded, seeded[0]?.id ?? null);
          loaded = seeded;
        }

        if (!cancelled) {
          setPages(loaded);
          const requestedId = new URLSearchParams(window.location.search).get("page");
          const { activeId } = loadLocal();
          const initialId = requestedId && loaded.some((p) => p.id === requestedId)
            ? requestedId
            : activeId && loaded.some((p) => p.id === activeId)
              ? activeId
              : loaded[0]?.id ?? null;
          setActivePageId(initialId);
        }
      } catch (err) {
        console.error("[usePages] load error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [profile?.id, workspace?.id]);

  // ── Lazy-load blocks when switching pages ─────────────────

  const activePage = pages.find((p) => p.id === activePageId) ?? null;

  useEffect(() => {
    if (!activePageId) return;
    const url = new URL(window.location.href);
    url.searchParams.set("page", activePageId);
    window.history.replaceState(null, "", url);
  }, [activePageId]);

  useEffect(() => {
    if (!activePageId) return;
    const page = pages.find((p) => p.id === activePageId);
    if (!page || page.blocks.length > 0) return; // already loaded

    fetchPageBlocks(activePageId).then((blocks) => {
      if (blocks.length === 0) {
        const empty = mkBlock("text", activePageId, 0);
        setPages((ps) =>
          ps.map((p) => (p.id === activePageId ? { ...p, blocks: [empty] } : p))
        );
      } else {
        setPages((ps) =>
          ps.map((p) => (p.id === activePageId ? { ...p, blocks } : p))
        );
      }
    });
  }, [activePageId]);

  // ── Realtime block subscription ───────────────────────────

  useEffect(() => {
    if (!activePageId || isOfflineMode()) return;

    // Unsubscribe previous
    const prev = realtimeSubs.current.get(activePageId);
    if (prev) return; // already subscribed

    const unsub = subscribeToPageChanges(
      activePageId,
      (raw) => {
        const block = { ...(raw as unknown as Block), v: 0 };
        setPages((ps) =>
          ps.map((p) => {
            if (p.id !== activePageId) return p;
            const exists = p.blocks.some((b) => b.id === block.id);
            return {
              ...p,
              blocks: exists
                ? p.blocks.map((b) => (b.id === block.id ? { ...block, v: b.v + 1 } : b))
                : [...p.blocks, block].sort((a, b) => a.sort_order - b.sort_order),
            };
          })
        );
      },
      (raw) => {
        const block = { ...(raw as unknown as Block), v: 0 };
        setPages((ps) =>
          ps.map((p) => {
            if (p.id !== activePageId) return p;
            return {
              ...p,
              blocks: p.blocks.map((b) =>
                b.id === block.id ? { ...block, v: b.v + 1 } : b
              ),
            };
          })
        );
      },
      (blockId) => {
        setPages((ps) =>
          ps.map((p) => ({
            ...p,
            blocks: p.blocks.filter((b) => b.id !== blockId),
          }))
        );
      }
    );

    realtimeSubs.current.set(activePageId, unsub);
    return () => {
      unsub();
      realtimeSubs.current.delete(activePageId);
    };
  }, [activePageId]);

  // ── Debounced save ────────────────────────────────────────

  const scheduleSave = useCallback((updatedPages: Page[], pid: string | null) => {
    setSaveStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        if (isOfflineMode()) {
          saveLocal(updatedPages, pid);
        } else {
          // Online: upsert dirty blocks
          const page = updatedPages.find((p) => p.id === pid);
          if (page?.blocks.length) {
            await upsertBlocks(page.blocks);
          }
        }
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, 600);
  }, []);

  // ── Mutate helpers ────────────────────────────────────────

  const mutatePage = useCallback(
    (pid: string, fn: (p: Page) => Page) => {
      setPages((ps) => {
        const updated = ps.map((p) =>
          p.id === pid ? { ...fn(p), updated_at: new Date().toISOString() } : p
        );
        scheduleSave(updated, pid);
        return updated;
      });
    },
    [scheduleSave]
  );

  const mutateBlocks = useCallback(
    (pid: string, fn: (bs: Block[]) => Block[]) => {
      mutatePage(pid, (p) => ({ ...p, blocks: fn(p.blocks) }));
    },
    [mutatePage]
  );

  // ── Page CRUD ─────────────────────────────────────────────

  const createPage = useCallback(
    async (parentId?: string | null) => {
      if (!workspace || !profile) return null;
      const page = await dbCreatePage(workspace.id, profile.id, {
        parent_id: parentId ?? null,
        icon: randomFrom(PAGE_ICONS),
      });
      setPages((ps) => [page, ...ps]);
      setActivePageId(page.id);
      return page;
    },
    [workspace, profile]
  );

  const deletePage = useCallback(
    async (pageId: string) => {
      await softDeletePage(pageId);
      setPages((ps) => ps.filter((p) => p.id !== pageId));
      setActivePageId((id) => (id === pageId ? pages.find((p) => p.id !== pageId)?.id ?? null : id));
    },
    [pages]
  );

  const updatePageMeta = useCallback(
    async (
      pageId: string,
      updates: Partial<Pick<Page, "title" | "icon" | "cover_url" | "is_public">>
    ) => {
      if (!profile) return;
      mutatePage(pageId, (p) => ({ ...p, ...updates }));
      if (!isOfflineMode()) {
        try {
          await dbUpdatePage(pageId, updates, profile.id);
        } catch (error) {
          console.error("[usePages] metadata save failed", error);
          setSaveStatus("error");
        }
      }
    },
    [profile, mutatePage]
  );

  // ── Block CRUD ────────────────────────────────────────────

  const convertBlock = useCallback(
    (pageId: string, blockId: string, type: BlockType) => {
      mutateBlocks(pageId, (bs) =>
        bs.map((b) =>
          b.id === blockId
            ? {
                ...mkBlock(type, pageId, b.sort_order),
                id: blockId,
                v: b.v + 1,
              }
            : b
        )
      );
    },
    [mutateBlocks]
  );

  const insertBlock = useCallback(
    (pageId: string, afterId: string | null, type: BlockType): Block => {
      const page = pages.find((p) => p.id === pageId);
      const blocks = page?.blocks ?? [];
      const afterIdx = afterId ? blocks.findIndex((b) => b.id === afterId) : blocks.length - 1;
      const sortOrder = afterIdx >= 0 ? (blocks[afterIdx]?.sort_order ?? 0) + 500 : 0;
      const nb = mkBlock(type, pageId, sortOrder);

      mutateBlocks(pageId, (bs) => {
        const copy = [...bs];
        copy.splice(afterIdx + 1, 0, nb);
        return copy;
      });
      return nb;
    },
    [pages, mutateBlocks]
  );

  const updateBlock = useCallback(
    (pageId: string, blockId: string, updates: Partial<Block>) => {
      mutateBlocks(pageId, (bs) =>
        bs.map((b) => (b.id === blockId ? { ...b, ...updates } : b))
      );
    },
    [mutateBlocks]
  );

  const removeBlock = useCallback(
    (pageId: string, blockId: string) => {
      mutateBlocks(pageId, (bs) => {
        const left = bs.filter((b) => b.id !== blockId);
        if (!isOfflineMode()) dbDeleteBlock(blockId);
        return left.length ? left : [mkBlock("text", pageId, 0)];
      });
    },
    [mutateBlocks]
  );

  const duplicateBlock = useCallback(
    (pageId: string, blockId: string): Block | null => {
      const page = pages.find((p) => p.id === pageId);
      const blk  = page?.blocks.find((b) => b.id === blockId);
      if (!blk) return null;

      const copy: Block = {
        ...blk,
        id: uid(),
        v: 0,
        rows: blk.rows ? blk.rows.map((r) => [...r]) : undefined,
        sort_order: blk.sort_order + 1,
      };

      mutateBlocks(pageId, (bs) => {
        const i = bs.findIndex((b) => b.id === blockId);
        const c = [...bs];
        c.splice(i + 1, 0, copy);
        return c;
      });
      return copy;
    },
    [pages, mutateBlocks]
  );

  const moveBlock = useCallback(
    (pageId: string, blockId: string, dir: "up" | "down") => {
      mutateBlocks(pageId, (bs) => {
        const i = bs.findIndex((b) => b.id === blockId);
        const j = dir === "up" ? i - 1 : i + 1;
        if (i < 0 || j < 0 || j >= bs.length) return bs;
        const c = [...bs];
        [c[i], c[j]] = [c[j], c[i]];
        return c;
      });
    },
    [mutateBlocks]
  );

  const reorderBlocksLocal = useCallback(
    (pageId: string, newOrder: Block[]) => {
      mutateBlocks(pageId, () => newOrder);
    },
    [mutateBlocks]
  );

  // ── Markdown shortcuts ────────────────────────────────────

  const applyMarkdownShortcut = useCallback(
    (pageId: string, blockId: string, plain: string): boolean => {
      const shortcuts: [RegExp, BlockType][] = [
        [/^#\s$/, "h1"],
        [/^##\s$/, "h2"],
        [/^###\s$/, "h3"],
        [/^[-*]\s$/, "bullet"],
        [/^1\.\s$/, "numbered"],
        [/^\[\s?\]\s$/, "todo"],
        [/^>\s$/, "quote"],
      ];
      for (const [re, t] of shortcuts) {
        if (re.test(plain)) { convertBlock(pageId, blockId, t); return true; }
      }
      if (/^```\s*$/.test(plain)) { convertBlock(pageId, blockId, "code"); return true; }
      if (/^-{3,}\s*$/.test(plain)) {
        const nb = insertBlock(pageId, blockId, "text");
        mutateBlocks(pageId, (bs) =>
          bs.map((b) =>
            b.id === blockId
              ? { ...b, type: "divider", html: "", v: b.v + 1 }
              : b
          )
        );
        return true;
      }
      return false;
    },
    [convertBlock, insertBlock, mutateBlocks]
  );

  // ── Callout icon cycle ────────────────────────────────────

  const cycleCalloutIcon = useCallback(
    (pageId: string, blockId: string) => {
      mutateBlocks(pageId, (bs) =>
        bs.map((b) => {
          if (b.id !== blockId) return b;
          const i = CALLOUT_ICONS.indexOf(b.icon ?? "💡");
          return { ...b, icon: CALLOUT_ICONS[(i + 1) % CALLOUT_ICONS.length] };
        })
      );
    },
    [mutateBlocks]
  );

  // ── Block split (Enter key) ───────────────────────────────

  const splitBlock = useCallback(
    (pageId: string, blockId: string, offset: number): Block | null => {
      const page   = pages.find((p) => p.id === pageId);
      const blocks = page?.blocks ?? [];
      const idx    = blocks.findIndex((b) => b.id === blockId);
      if (idx < 0) return null;
      const blk   = blocks[idx];
      const plain = stripHtml(blk.html);

      if (plain === "" && blk.type !== "text") {
        convertBlock(pageId, blockId, "text");
        return blk;
      }

      const cont: BlockType =
        ["todo","bullet","numbered","quote"].includes(blk.type)
          ? (blk.type as BlockType)
          : "text";

      const nb = mkBlock(cont, pageId, blk.sort_order + 500);
      nb.html  = escapeHtml(plain.slice(offset));
      const head = escapeHtml(plain.slice(0, offset));

      mutateBlocks(pageId, (bs) => {
        const copy = [...bs];
        copy[idx] = { ...copy[idx], html: head, v: copy[idx].v + 1 };
        copy.splice(idx + 1, 0, nb);
        return copy;
      });
      return nb;
    },
    [pages, mutateBlocks, convertBlock]
  );

  // ── Block merge (Backspace at start) ──────────────────────

  const mergeBlockWithPrev = useCallback(
    (pageId: string, blockId: string): { targetId: string; mergePos: number } | null => {
      const page   = pages.find((p) => p.id === pageId);
      const blocks = page?.blocks ?? [];
      const idx    = blocks.findIndex((b) => b.id === blockId);
      if (idx <= 0) return null;

      const blk  = blocks[idx];
      const prev = blocks[idx - 1];
      const TEXT_LIKE = ["text","todo","bullet","numbered","quote","callout","h1","h2","h3"];

      if (stripHtml(blk.html) === "" && blk.type !== "text") {
        convertBlock(pageId, blockId, "text");
        return null;
      }

      if (!TEXT_LIKE.includes(prev.type)) {
        mutateBlocks(pageId, (bs) => bs.filter((b) => b.id !== blockId));
        if (!isOfflineMode()) dbDeleteBlock(blockId);
        return null;
      }

      const prevPlain = stripHtml(prev.html);
      const currPlain = stripHtml(blk.html);
      const mergePos  = prevPlain.length;

      mutateBlocks(pageId, (bs) => {
        const copy = [...bs];
        copy[idx - 1] = {
          ...prev,
          html: escapeHtml(prevPlain + currPlain),
          v: prev.v + 1,
        };
        copy.splice(idx, 1);
        if (!isOfflineMode()) dbDeleteBlock(blk.id);
        return copy;
      });

      return { targetId: prev.id, mergePos };
    },
    [pages, mutateBlocks, convertBlock]
  );

  return {
    pages,
    activePage,
    activePageId,
    setActivePageId,
    saveStatus,
    loading,
    createPage,
    deletePage,
    updatePageMeta,
    mutatePage,
    mutateBlocks,
    convertBlock,
    insertBlock,
    updateBlock,
    removeBlock,
    duplicateBlock,
    moveBlock,
    reorderBlocksLocal,
    splitBlock,
    mergeBlockWithPrev,
    applyMarkdownShortcut,
    cycleCalloutIcon,
  };
}
