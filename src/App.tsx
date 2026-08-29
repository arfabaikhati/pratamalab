import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { Block, BlockType, FocusReq, Page, SlashDef, Toast } from "./types";
import {
  CALLOUT_ICONS, PAGE_ICONS, STORAGE_KEY, countWords, escapeHtml, stripHtml, timeAgo, uid,
} from "./lib/util";
import { makeSeed } from "./data/seed";
import Sidebar from "./components/Sidebar";
import BlockView from "./components/BlockView";
import type { BlockHandlers } from "./components/BlockView";
import PresentMode from "./components/PresentMode";
import { IcBraces, IcCheck, IcLogo, IcMenu, IcPresent } from "./components/icons";

const SLASH_DEFS: SlashDef[] = [
  { type: "text", label: "Teks", desc: "Paragraf biasa", kw: "text paragraph paragraf tulisan tulis" },
  { type: "h1", label: "Judul 1", desc: "Judul bagian paling besar", kw: "heading header judul besar title h1" },
  { type: "h2", label: "Judul 2", desc: "Judul bagian sedang", kw: "heading subjudul judul sedang h2" },
  { type: "h3", label: "Judul 3", desc: "Judul bagian kecil", kw: "heading judul kecil h3" },
  { type: "todo", label: "Daftar Tugas", desc: "Tugas dengan kotak centang", kw: "todo checklist tugas centang checkbox" },
  { type: "bullet", label: "Daftar Poin", desc: "Daftar dengan poin", kw: "bullet list poin daftar" },
  { type: "numbered", label: "Daftar Nomor", desc: "Daftar bernomor urut", kw: "numbered nomor angka urutan list" },
  { type: "quote", label: "Kutipan", desc: "Kutipan atau catatan pinggir", kw: "quote kutipan sitasi blockquote" },
  { type: "callout", label: "Sorotan", desc: "Kotak info berikon", kw: "callout highlight sorotan info penting" },
  { type: "formula", label: "Rumus", desc: "Hitung matematika, hasil langsung", kw: "formula rumus kalkulator hitung math matematika" },
  { type: "table", label: "Tabel", desc: "Baris & kolom yang bisa diedit", kw: "table tabel grid kolom baris spreadsheet" },
  { type: "code", label: "Kode", desc: "Potongan kode program", kw: "code kode snippet program script" },
  { type: "divider", label: "Garis Pembatas", desc: "Pemisah antar bagian", kw: "divider garis pemisah pembatas hr" },
];

const TEXT_LIKE: BlockType[] = ["text", "todo", "bullet", "numbered", "quote", "callout", "h1", "h2", "h3"];

function mkBlock(type: BlockType): Block {
  return {
    id: uid(),
    type,
    html: "",
    v: 0,
    ...(type === "todo" ? { checked: false } : {}),
    ...(type === "table" ? { rows: [["", "", ""], ["", "", ""], ["", "", ""]] } : {}),
    ...(type === "callout" ? { icon: "💡" } : {}),
    ...(type === "code" ? { lang: "js" } : {}),
  };
}

function loadState(): { pages: Page[]; activeId: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw) as { pages?: Page[]; activeId?: string };
      if (Array.isArray(d.pages))
        return { pages: d.pages, activeId: d.activeId ?? d.pages[0]?.id ?? null };
    }
  } catch {
    /* abaikan data rusak */
  }
  const seed = makeSeed();
  return { pages: seed.pages, activeId: seed.activeId };
}

export default function App() {
  const [boot] = useState(loadState);
  const [pages, setPages] = useState<Page[]>(boot.pages);
  const [activeId, setActiveId] = useState<string | null>(boot.activeId);
  const [focus, setFocus] = useState<FocusReq | null>(null);
  const [slash, setSlash] = useState<{ blockId: string; query: string } | null>(null);
  const [slashIdx, setSlashIdx] = useState(0);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [presenting, setPresenting] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [iconPicker, setIconPicker] = useState(false);
  const [titleTick, setTitleTick] = useState(0);
  const tick = useRef(1);
  const dismissed = useRef<{ id: string; q: string } | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);

  const activePage = pages.find((p) => p.id === activeId) ?? null;

  /* ---------- efek global ---------- */

  useEffect(() => {
    setSaveState("saving");
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ pages, activeId }));
      } catch {
        /* penyimpanan penuh */
      }
      setSaveState("saved");
    }, 550);
    return () => clearTimeout(t);
  }, [pages, activeId]);

  useEffect(() => {
    if (!activeId || !pages.some((p) => p.id === activeId))
      setActiveId(pages[0]?.id ?? null);
  }, [pages, activeId]);

  useEffect(() => {
    document.body.style.overflow = presenting ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [presenting]);

  useEffect(() => {
    if (titleTick) titleRef.current?.focus();
  }, [titleTick]);

  /* ---------- util ---------- */

  const toast = (msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  };

  const focusTo = (id: string, pos: number) =>
    setFocus({ id, pos, tick: ++tick.current });

  const mutatePage = (pid: string, fn: (p: Page) => Page) =>
    setPages((ps) => ps.map((p) => (p.id === pid ? { ...fn(p), updatedAt: Date.now() } : p)));

  const mutateBlocks = (pid: string, fn: (bs: Block[]) => Block[]) =>
    mutatePage(pid, (p) => ({ ...p, blocks: fn(p.blocks) }));

  /* ---------- operasi blok ---------- */

  const convertBlock = (id: string, type: BlockType) => {
    if (!activePage) return;
    mutateBlocks(activePage.id, (bs) =>
      bs.map((b) => (b.id === id ? { ...mkBlock(type), id: b.id, v: b.v + 1 } : b))
    );
    setSlash(null);
    dismissed.current = null;
    focusTo(id, 0);
  };

  const applySlash = (id: string, def: SlashDef) => {
    if (!activePage) return;
    const blk = activePage.blocks.find((b) => b.id === id);
    const plain = blk ? stripHtml(blk.html) : "";
    const isSlashOnly = plain.trim() === "" || plain.trim().startsWith("/");
    if (def.type !== "divider" && !isSlashOnly) {
      // blok berisi konten → sisipkan blok baru di bawahnya, jangan timpa
      const nb = mkBlock(def.type);
      mutateBlocks(activePage.id, (bs) => {
        const i = bs.findIndex((b) => b.id === id);
        if (i < 0) return bs;
        const copy = [...bs];
        copy.splice(i + 1, 0, nb);
        return copy;
      });
      setSlash(null);
      if (TEXT_LIKE.includes(def.type)) focusTo(nb.id, 0);
      return;
    }
    if (def.type === "divider") {
      const nb = mkBlock("divider");
      mutateBlocks(activePage.id, (bs) => {
        const i = bs.findIndex((b) => b.id === id);
        if (i < 0) return bs;
        const copy = [...bs];
        copy[i] = { ...copy[i], html: "", v: copy[i].v + 1 };
        copy.splice(i + 1, 0, nb);
        return copy;
      });
      setSlash(null);
      focusTo(id, 0);
    } else {
      convertBlock(id, def.type);
    }
  };

  const onBlockChange = (id: string, html: string, plain: string) => {
    if (!activePage) return;
    const blk = activePage.blocks.find((b) => b.id === id);
    if (!blk) return;
    mutateBlocks(activePage.id, (bs) => bs.map((b) => (b.id === id ? { ...b, html } : b)));

    if (!TEXT_LIKE.includes(blk.type)) {
      setSlash((s) => (s?.blockId === id ? null : s));
      return;
    }

    if (plain.startsWith("/")) {
      const q = plain.slice(1).toLowerCase().trim();
      const wasDismissed = dismissed.current?.id === id && dismissed.current.q === q;
      if (!wasDismissed) {
        setSlash({ blockId: id, query: q });
        setSlashIdx(0);
      }
      return;
    }
    setSlash((s) => (s?.blockId === id ? null : s));

    if (blk.type === "text") {
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
        if (re.test(plain)) {
          convertBlock(id, t);
          return;
        }
      }
      if (/^```\s*$/.test(plain)) {
        convertBlock(id, "code");
        return;
      }
      if (/^-{3,}\s*$/.test(plain)) {
        const nb = mkBlock("text");
        mutateBlocks(activePage.id, (bs) => {
          const i = bs.findIndex((b) => b.id === id);
          if (i < 0) return bs;
          const copy = [...bs];
          copy[i] = { ...copy[i], type: "divider", html: "", v: copy[i].v + 1 };
          copy.splice(i + 1, 0, nb);
          return copy;
        });
        focusTo(nb.id, 0);
      }
    }
  };

  const slashItems = useMemo(() => {
    if (!slash) return [] as SlashDef[];
    const q = slash.query;
    return SLASH_DEFS.filter(
      (d) => !q || d.label.toLowerCase().includes(q) || d.kw.toLowerCase().includes(q)
    );
  }, [slash]);

  const onSlashKey = (id: string, e: ReactKeyboardEvent<HTMLDivElement>): boolean => {
    if (!slash || slash.blockId !== id) return false;
    const items = slashItems;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSlashIdx((i) => (items.length ? (i + 1) % items.length : 0));
      return true;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSlashIdx((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
      return true;
    }
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const d = items[Math.min(slashIdx, items.length - 1)];
      if (d) applySlash(id, d);
      else {
        dismissed.current = { id, q: slash.query };
        setSlash(null);
      }
      return true;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      dismissed.current = { id, q: slash.query };
      setSlash(null);
      return true;
    }
    return false;
  };

  const onEnter = (id: string, offset: number) => {
    if (!activePage) return;
    const blocks = activePage.blocks;
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const blk = blocks[idx];
    const plain = stripHtml(blk.html);

    if (plain === "" && blk.type !== "text") {
      if (blk.type === "divider") {
        const nb = mkBlock("text");
        mutateBlocks(activePage.id, (bs) => {
          const copy = [...bs];
          copy.splice(idx + 1, 0, nb);
          return copy;
        });
        focusTo(nb.id, 0);
        return;
      }
      convertBlock(id, "text");
      return;
    }

    const cont: BlockType =
      blk.type === "todo" || blk.type === "bullet" || blk.type === "numbered"
        ? blk.type
        : blk.type === "quote"
          ? "quote"
          : "text";
    const nb = mkBlock(cont);
    nb.html = escapeHtml(plain.slice(offset));
    const head = escapeHtml(plain.slice(0, offset));
    mutateBlocks(activePage.id, (bs) => {
      const copy = [...bs];
      copy[idx] = { ...copy[idx], html: head, v: copy[idx].v + 1 };
      copy.splice(idx + 1, 0, nb);
      return copy;
    });
    setSlash(null);
    focusTo(nb.id, 0);
  };

  const onBackspaceStart = (id: string) => {
    if (!activePage) return;
    const blocks = activePage.blocks;
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const blk = blocks[idx];
    const plain = stripHtml(blk.html);

    if (plain === "" && blk.type !== "text") {
      convertBlock(id, "text");
      return;
    }
    if (idx === 0) return;
    const prev = blocks[idx - 1];
    if (!TEXT_LIKE.includes(prev.type)) {
      mutateBlocks(activePage.id, (bs) => bs.filter((b) => b.id !== id));
      setSlash(null);
      return;
    }
    const prevPlain = stripHtml(prev.html);
    mutateBlocks(activePage.id, (bs) => {
      const copy = [...bs];
      copy[idx - 1] = { ...prev, html: escapeHtml(prevPlain + plain), v: prev.v + 1 };
      copy.splice(idx, 1);
      return copy;
    });
    setSlash(null);
    focusTo(prev.id, prevPlain.length);
  };

  const onArrow = (id: string, dir: "up" | "down") => {
    if (!activePage) return;
    const blocks = activePage.blocks;
    const idx = blocks.findIndex((b) => b.id === id);
    const target = dir === "up" ? blocks[idx - 1] : blocks[idx + 1];
    if (!target || !TEXT_LIKE.includes(target.type)) return;
    focusTo(target.id, dir === "up" ? 99999 : 0);
  };

  const handlers: BlockHandlers = {
    onChange: onBlockChange,
    onEnter,
    onBackspaceStart,
    onArrow,
    onSlashKey,
    focusReq: focus,
    onToggle: (id) => {
      if (!activePage) return;
      mutateBlocks(activePage.id, (bs) =>
        bs.map((b) => (b.id === id ? { ...b, checked: !b.checked } : b))
      );
    },
    onDelete: (id) => {
      if (!activePage) return;
      mutateBlocks(activePage.id, (bs) => {
        const left = bs.filter((b) => b.id !== id);
        return left.length ? left : [mkBlock("text")];
      });
      toast("Blok dihapus");
    },
    onDuplicate: (id) => {
      if (!activePage) return;
      const blk = activePage.blocks.find((b) => b.id === id);
      if (!blk) return;
      const copy: Block = {
        ...blk,
        id: uid(),
        v: blk.v + 1,
        rows: blk.rows ? blk.rows.map((r) => [...r]) : undefined,
      };
      mutateBlocks(activePage.id, (bs) => {
        const i = bs.findIndex((b) => b.id === id);
        const c = [...bs];
        c.splice(i + 1, 0, copy);
        return c;
      });
      if (TEXT_LIKE.includes(copy.type)) focusTo(copy.id, 99999);
      toast("Blok diduplikat");
    },
    onMove: (id, dir) => {
      if (!activePage) return;
      mutateBlocks(activePage.id, (bs) => {
        const i = bs.findIndex((b) => b.id === id);
        const j = dir === "up" ? i - 1 : i + 1;
        if (i < 0 || j < 0 || j >= bs.length) return bs;
        const c = [...bs];
        [c[i], c[j]] = [c[j], c[i]];
        return c;
      });
    },
    onPlus: (id) => {
      setSlash({ blockId: id, query: "" });
      setSlashIdx(0);
    },
    onFormulaChange: (id, expr) => {
      if (!activePage) return;
      mutateBlocks(activePage.id, (bs) => bs.map((b) => (b.id === id ? { ...b, html: expr } : b)));
    },
    onRowsChange: (id, rows) => {
      if (!activePage) return;
      mutateBlocks(activePage.id, (bs) => bs.map((b) => (b.id === id ? { ...b, rows } : b)));
    },
    onCodeChange: (id, code) => {
      if (!activePage) return;
      mutateBlocks(activePage.id, (bs) => bs.map((b) => (b.id === id ? { ...b, html: code } : b)));
    },
    onCodeLang: (id, lang) => {
      if (!activePage) return;
      mutateBlocks(activePage.id, (bs) => bs.map((b) => (b.id === id ? { ...b, lang } : b)));
    },
    onCalloutIcon: (id) => {
      if (!activePage) return;
      mutateBlocks(activePage.id, (bs) =>
        bs.map((b) => {
          if (b.id !== id) return b;
          const i = CALLOUT_ICONS.indexOf(b.icon ?? "💡");
          return { ...b, icon: CALLOUT_ICONS[(i + 1) % CALLOUT_ICONS.length] };
        })
      );
    },
    onToast: toast,
  };

  /* ---------- operasi halaman ---------- */

  const createPage = () => {
    const p: Page = {
      id: uid(),
      icon: PAGE_ICONS[Math.floor(Math.random() * PAGE_ICONS.length)],
      title: "",
      blocks: [mkBlock("text")],
      updatedAt: Date.now(),
    };
    setPages((ps) => [p, ...ps]);
    setActiveId(p.id);
    setMobileNav(false);
    toast("Halaman baru dibuat");
    setTimeout(() => setTitleTick((t) => t + 1), 80);
  };

  const deletePage = (id: string) => {
    setPages((ps) => ps.filter((p) => p.id !== id));
    toast("Halaman dihapus");
  };

  const copyJson = () => {
    if (!activePage) return;
    const text = JSON.stringify(activePage, null, 2);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => toast("JSON halaman disalin ke clipboard"),
        () => toast("Gagal menyalin — akses clipboard ditolak")
      );
    } else toast("Clipboard tidak tersedia di peramban ini");
  };

  const addTextAtEnd = () => {
    if (!activePage) return;
    const nb = mkBlock("text");
    mutateBlocks(activePage.id, (bs) => [...bs, nb]);
    focusTo(nb.id, 0);
  };

  const words = useMemo(
    () => (activePage ? activePage.blocks.reduce((a, b) => a + countWords(b.html), 0) : 0),
    [activePage]
  );

  const totalBlocks = useMemo(() => pages.reduce((a, p) => a + p.blocks.length, 0), [pages]);

  const slashFor = (b: Block) =>
    slash && slash.blockId === b.id
      ? {
          query: slash.query,
          idx: slashIdx,
          items: slashItems,
          onIdx: setSlashIdx,
          onPick: (d: SlashDef) => applySlash(b.id, d),
        }
      : null;

  /* ---------- render ---------- */

  if (!activePage) {
    return (
      <div className="relative flex h-full items-center justify-center overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{ backgroundImage: "radial-gradient(#d9d6cb 1px, transparent 1px)", backgroundSize: "22px 22px" }}
        />
        <div className="pointer-events-none absolute -top-20 right-1/4 h-72 w-72 animate-drift rounded-full bg-pine-soft blur-3xl" />
        <div className="relative mx-4 max-w-sm animate-rise rounded-2xl border border-line bg-card p-8 text-center shadow-[0_24px_60px_-24px_rgba(21,24,29,0.3)]">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-pine text-white shadow-[0_10px_24px_-8px_rgba(14,133,120,0.6)]">
            <IcLogo width={30} height={30} />
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-ink">
            Belum ada halaman
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-fade">
            Mulai catatan pertamamu — dokumen, tabel, rumus, dan presentasi menunggu untuk diisi.
          </p>
          <button
            type="button"
            onClick={createPage}
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-pine px-5 text-[13.5px] font-semibold text-white transition hover:-translate-y-px hover:bg-pine-deep hover:shadow-lg active:scale-95"
          >
            Buat halaman pertama
          </button>
        </div>
      </div>
    );
  }

  let num = 0;

  return (
    <div className="flex h-full overflow-hidden">
      {/* sidebar desktop */}
      <div className="hidden h-full md:block">
        <Sidebar
          pages={pages}
          activeId={activeId}
          totalBlocks={totalBlocks}
          onSelect={(id) => { setActiveId(id); setSlash(null); }}
          onCreate={createPage}
          onDelete={deletePage}
        />
      </div>

      {/* sidebar mobile */}
      {mobileNav && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 animate-fadein bg-ink/50" onClick={() => setMobileNav(false)} />
          <div className="absolute left-0 top-0 h-full animate-pop">
            <Sidebar
              pages={pages}
              activeId={activeId}
              totalBlocks={totalBlocks}
              onSelect={(id) => { setActiveId(id); setMobileNav(false); setSlash(null); }}
              onCreate={createPage}
              onDelete={deletePage}
            />
          </div>
        </div>
      )}

      {/* area kerja */}
      <main className="relative flex-1 overflow-y-auto">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 opacity-45"
            style={{ backgroundImage: "radial-gradient(#d9d6cb 1px, transparent 1px)", backgroundSize: "22px 22px" }}
          />
          <div className="absolute -top-24 right-[8%] h-80 w-80 animate-drift rounded-full bg-pine-soft blur-3xl" />
          <div className="absolute left-[12%] top-64 h-64 w-64 animate-drift-2 rounded-full bg-honey-soft blur-3xl" />
        </div>

        {/* bilah atas */}
        <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/85 backdrop-blur">
          <div className="mx-auto flex h-12 max-w-[56rem] items-center justify-between gap-3 px-4 sm:px-8">
            <div className="flex min-w-0 items-center gap-2.5">
              <button
                type="button"
                aria-label="Buka navigasi"
                onClick={() => setMobileNav(true)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-fade transition hover:bg-line/70 hover:text-ink md:hidden"
              >
                <IcMenu width={16} height={16} />
              </button>
              <span className="hidden shrink-0 font-display text-[13.5px] font-bold text-ink sm:inline">
                pratama<span className="text-pine">lab</span>
              </span>
              <span className="hidden text-faint sm:inline">/</span>
              <span className="truncate text-[13px] text-fade">
                {activePage.title || "Tanpa judul"}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              <span className="hidden items-center gap-1.5 text-[11.5px] text-fade sm:flex">
                <span
                  className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                    saveState === "saving" ? "animate-pulse bg-honey" : "bg-pine"
                  }`}
                />
                {saveState === "saving" ? "Menyimpan…" : "Tersimpan"}
              </span>
              <button
                type="button"
                title="Salin JSON halaman"
                onClick={copyJson}
                className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-card text-fade transition hover:border-pine/50 hover:text-pine-deep hover:shadow-sm active:scale-90"
              >
                <IcBraces width={15} height={15} />
              </button>
              <button
                type="button"
                onClick={() => setPresenting(true)}
                className="inline-flex h-8 items-center gap-2 rounded-lg bg-ink px-3.5 text-[12.5px] font-semibold text-paper shadow-sm transition hover:-translate-y-px hover:bg-ink-3 hover:shadow-md active:scale-95"
              >
                <IcPresent width={15} height={15} className="text-pine-bright" />
                Presentasikan
              </button>
            </div>
          </div>
        </header>

        {/* konten halaman */}
        <div className="relative z-10 mx-auto max-w-[46rem] px-5 pb-36 pt-8 sm:px-8">
          {/* kepala halaman */}
          <div className="relative animate-rise">
            {iconPicker && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIconPicker(false)} />
                <div className="absolute left-0 top-16 z-30 grid w-56 animate-pop grid-cols-5 gap-1 rounded-xl border border-line bg-card p-2 shadow-[0_16px_40px_-12px_rgba(21,24,29,0.3)]">
                  {PAGE_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => {
                        mutatePage(activePage.id, (p) => ({ ...p, icon: ic }));
                        setIconPicker(false);
                      }}
                      className={`grid h-9 w-9 place-items-center rounded-lg text-[19px] transition hover:scale-110 hover:bg-pine-soft active:scale-95 ${
                        activePage.icon === ic ? "bg-pine-soft ring-1 ring-pine/40" : ""
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </>
            )}
            <button
              type="button"
              title="Ganti ikon halaman"
              onClick={() => setIconPicker((v) => !v)}
              className="rounded-xl p-2 text-[42px] leading-none transition hover:bg-line/60 active:scale-95"
            >
              {activePage.icon}
            </button>
            <input
              ref={titleRef}
              value={activePage.title}
              onChange={(e) => mutatePage(activePage.id, (p) => ({ ...p, title: e.target.value }))}
              placeholder="Tanpa judul"
              className="mt-1 w-full bg-transparent font-display text-[2.3rem] font-bold leading-tight tracking-tight text-ink outline-none placeholder:text-faint"
            />
            <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-fade">
              <span>Diedit {timeAgo(activePage.updatedAt)}</span>
              <span className="text-line">•</span>
              <span>{activePage.blocks.length} blok</span>
              <span className="text-line">•</span>
              <span>{words} kata</span>
              <span className="ml-1 rounded-md bg-pine-soft px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-pine-deep">
                kanvas bebas
              </span>
            </p>
          </div>

          {/* daftar blok */}
          <div key={activePage.id} className="mt-7 space-y-[2px]">
            {activePage.blocks.map((b, i) => {
              num = b.type === "numbered" ? num + 1 : 0;
              return (
                <BlockView
                  key={b.id}
                  block={b}
                  i={i}
                  num={num || undefined}
                  h={handlers}
                  slash={slashFor(b)}
                />
              );
            })}
          </div>

          {/* zona tambah */}
          <button
            type="button"
            onClick={addTextAtEnd}
            className="mt-3 w-full rounded-lg px-2 py-5 text-left text-[14px] text-faint transition hover:bg-card hover:text-pine-deep"
          >
            Klik untuk menulis, atau tekan <span className="kbd">/</span> untuk perintah…
          </button>

          {/* panduan singkat */}
          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-[11.5px] text-fade">
            <span className="flex items-center gap-1.5"><span className="kbd">/</span> menu blok</span>
            <span className="flex items-center gap-1.5"><span className="kbd">Ctrl/⌘ B</span> tebal</span>
            <span className="flex items-center gap-1.5"><span className="kbd">Ctrl/⌘ I</span> miring</span>
            <span className="flex items-center gap-1.5"><span className="kbd">Ctrl/⌘ U</span> garis bawah</span>
            <span className="flex items-center gap-1.5"><span className="kbd">↵</span> blok baru</span>
            <span className="flex items-center gap-1.5"><span className="kbd">⌫</span> gabung blok</span>
          </div>
        </div>
      </main>

      {/* toast */}
      <div className="fixed bottom-5 right-5 z-[70] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex animate-toast items-center gap-2.5 rounded-lg bg-ink px-4 py-2.5 text-[13px] font-medium text-paper shadow-[0_12px_30px_-8px_rgba(21,24,29,0.5)]"
          >
            <IcCheck width={14} height={14} className="shrink-0 text-pine-bright" />
            {t.msg}
          </div>
        ))}
      </div>

      {/* mode presentasi */}
      {presenting && activePage && (
        <PresentMode page={activePage} onClose={() => setPresenting(false)} />
      )}
    </div>
  );
}
