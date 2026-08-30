import type { Block, BlockType, Page } from "../types";

let _id = 1;
function sid() { return `seed-${_id++}`; }

function blk(
  type: BlockType,
  html: string,
  pageId: string,
  extra: Partial<Block> = {}
): Block {
  return {
    id: sid(),
    page_id: pageId,
    type,
    html,
    sort_order: (_id - 1) * 1000,
    v: 0,
    ...extra,
  };
}

export function makeSeed(
  workspaceId: string,
  userId: string
): { pages: Page[]; activeId: string } {
  const now = new Date().toISOString();

  // ── Page 1: Welcome ──────────────────────────────────────
  const p1id = "seed-page-1";
  const p1: Page = {
    id: p1id,
    workspace_id: workspaceId,
    parent_id: null,
    title: "Selamat Datang di Pratamalab 👋",
    icon: "🚀",
    cover_url: null,
    is_public: false,
    is_deleted: false,
    created_by: userId,
    updated_by: userId,
    sort_order: 0,
    created_at: now,
    updated_at: now,
    blocks: [
      blk("h1", "Selamat Datang di <b>Pratamalab</b>", p1id),
      blk("callout", "Ini adalah ruang kerja fleksibel Anda — seperti Notion + Canva + Google Docs dalam satu aplikasi.", p1id, { icon: "🚀" }),
      blk("h2", "Apa yang bisa kamu lakukan?", p1id),
      blk("bullet", "Buat dokumen, catatan, dan halaman tanpa batas", p1id),
      blk("bullet", "Gunakan <b>tabel</b>, <b>rumus</b>, dan <b>kode</b> dalam satu halaman", p1id),
      blk("bullet", "Kolaborasi <em>real-time</em> dengan tim", p1id),
      blk("bullet", "Ekspor ke Markdown, HTML, atau PDF", p1id),
      blk("bullet", "Mode presentasi bawaan — tidak perlu PowerPoint", p1id),
      blk("h2", "Mulai cepat", p1id),
      blk("todo", "Coba ketik <kbd>/</kbd> untuk melihat semua blok yang tersedia", p1id, { checked: false }),
      blk("todo", "Buat halaman baru dengan tombol <b>+</b> di sidebar", p1id, { checked: false }),
      blk("todo", "Aktifkan mode gelap di ikon bulan di pojok kiri bawah", p1id, { checked: false }),
      blk("todo", "Coba mode presentasi dengan tombol di toolbar atas", p1id, { checked: false }),
      blk("divider", "", p1id),
      blk("h3", "Pintasan keyboard", p1id),
      blk("text", "<kbd>/</kbd> — Buka menu perintah &nbsp;&nbsp; <kbd>Enter</kbd> — Baris baru &nbsp;&nbsp; <kbd>Ctrl+B</kbd> — Tebal &nbsp;&nbsp; <kbd>Ctrl+I</kbd> — Miring", p1id),
      blk("text", "Ketik <code># </code> untuk judul, <code>- </code> untuk poin, <code>[ ] </code> untuk tugas, <code>``` </code> untuk kode", p1id),
    ],
  };

  // ── Page 2: Project board ────────────────────────────────
  const p2id = "seed-page-2";
  const p2: Page = {
    id: p2id,
    workspace_id: workspaceId,
    parent_id: null,
    title: "Sprint 12 — Papan Proyek",
    icon: "📋",
    cover_url: null,
    is_public: false,
    is_deleted: false,
    created_by: userId,
    updated_by: userId,
    sort_order: 1000,
    created_at: now,
    updated_at: now,
    blocks: [
      blk("h1", "Sprint 12 — 14–28 Juli 2025", p2id),
      blk("callout", "Sprint ini fokus pada fitur kolaborasi real-time dan ekspor dokumen.", p2id, { icon: "🎯" }),
      blk("h2", "Sedang dikerjakan", p2id),
      blk("todo", "Integrasi Supabase Realtime untuk sync blok", p2id, { checked: false }),
      blk("todo", "Komponen presence cursor antar pengguna", p2id, { checked: false }),
      blk("todo", "Fitur ekspor ke PDF menggunakan print CSS", p2id, { checked: false }),
      blk("h2", "Selesai ✅", p2id),
      blk("todo", "Setup Supabase Auth dengan Google OAuth", p2id, { checked: true }),
      blk("todo", "Database schema dengan RLS policy", p2id, { checked: true }),
      blk("todo", "Drag-and-drop reorder blok menggunakan @dnd-kit", p2id, { checked: true }),
      blk("todo", "Dark mode dengan CSS variables", p2id, { checked: true }),
      blk("h2", "Catatan rapat", p2id),
      blk("quote", "\"Kita perlu memastikan offline mode bekerja sempurna sebelum fitur kolaborasi diluncurkan.\" — Lead Dev", p2id),
      blk("table", "", p2id, {
        rows: [
          ["Fitur","Estimasi","Status","Assignee"],
          ["Realtime sync","3 hari","In Progress","Andi"],
          ["Export PDF","2 hari","Todo","Budi"],
          ["Mobile responsive","1 hari","Done","Citra"],
        ],
      }),
    ],
  };

  // ── Page 3: Formula & Data ───────────────────────────────
  const p3id = "seed-page-3";
  const p3: Page = {
    id: p3id,
    workspace_id: workspaceId,
    parent_id: null,
    title: "Anggaran Q3 2025",
    icon: "📊",
    cover_url: null,
    is_public: false,
    is_deleted: false,
    created_by: userId,
    updated_by: userId,
    sort_order: 2000,
    created_at: now,
    updated_at: now,
    blocks: [
      blk("h1", "Anggaran Riset & Pengembangan — Q3 2025", p3id),
      blk("text", "Dokumen ini berisi rincian anggaran untuk kuartal ketiga tahun 2025.", p3id),
      blk("h2", "Rincian Anggaran", p3id),
      blk("table", "", p3id, {
        rows: [
          ["Kategori","Juli","Agustus","September","Total"],
          ["Infrastruktur Cloud","4500000","4500000","4500000","13500000"],
          ["Lisensi Software","1200000","1200000","1200000","3600000"],
          ["SDM (2 engineer)","28000000","28000000","28000000","84000000"],
          ["Marketing","5000000","3000000","7000000","15000000"],
        ],
      }),
      blk("h2", "Kalkulator Cepat", p3id),
      blk("formula", "28000000 * 2 + 4500000 + 1200000", p3id),
      blk("formula", "sqrt(144) + pow(2, 10)", p3id),
      blk("h2", "Catatan", p3id),
      blk("callout", "Anggaran total tidak boleh melebihi <b>Rp 120.000.000</b> per kuartal sesuai keputusan direksi.", p3id, { icon: "⚠️" }),
    ],
  };

  // ── Page 4: Code snippets ────────────────────────────────
  const p4id = "seed-page-4";
  const p4: Page = {
    id: p4id,
    workspace_id: workspaceId,
    parent_id: null,
    title: "Catatan Teknis",
    icon: "💻",
    cover_url: null,
    is_public: false,
    is_deleted: false,
    created_by: userId,
    updated_by: userId,
    sort_order: 3000,
    created_at: now,
    updated_at: now,
    blocks: [
      blk("h1", "Catatan Teknis — Setup Pratamalab", p4id),
      blk("h2", "Environment variables", p4id),
      blk("code", "VITE_SUPABASE_URL=https://your-project.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-key-here", p4id, { lang: "bash" }),
      blk("h2", "Query Supabase dasar", p4id),
      blk("code", `const { data, error } = await supabase
  .from('pages')
  .select('*, blocks(*)')
  .eq('workspace_id', workspaceId)
  .order('sort_order', { ascending: true });`, p4id, { lang: "ts" }),
      blk("h2", "RLS Policy contoh", p4id),
      blk("code", `create policy "Workspace members can read pages"
  on public.pages for select using (
    workspace_id in (
      select workspace_id from workspace_members
      where user_id = auth.uid()
    )
  );`, p4id, { lang: "sql" }),
      blk("h2", "Tips pengembangan", p4id),
      blk("numbered", "Selalu jalankan <code>npm run typecheck</code> sebelum commit", p4id),
      blk("numbered", "Gunakan <code>isOfflineMode()</code> untuk guard Supabase calls", p4id),
      blk("numbered", "Debounce save minimal 600ms untuk mengurangi writes", p4id),
    ],
  };

  return {
    pages: [p1, p2, p3, p4],
    activeId: p1id,
  };
}
