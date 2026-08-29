import type { Block, BlockType, Page } from "../types";
import { uid } from "../lib/util";

function B(type: BlockType, html = "", extra: Partial<Block> = {}): Block {
  return { id: uid(), type, html, v: 0, ...extra };
}

const now = Date.now();

export function makeSeed(): { pages: Page[]; activeId: string } {
  const welcome: Page = {
    id: uid(),
    icon: "🧪",
    title: "Selamat Datang di Pratamalab",
    updatedAt: now - 1000 * 60 * 4,
    blocks: [
      B("h1", "Ruang kerja serba bisa untuk idemu 👋"),
      B(
        "text",
        "Pratamalab adalah kanvas bebas untuk menulis: paragraf, judul, tabel, rumus yang <b>terhitung langsung</b>, potongan kode, sampai presentasi — semua dalam satu halaman. Tidak ada aturan, <i>kamu yang pegang kendali</i>."
      ),
      B(
        "callout",
        "Ketik <b>/</b> di baris mana pun untuk memunculkan menu blok. Gunakan <b>Ctrl/⌘ B</b> untuk tebal, <b>Ctrl/⌘ I</b> untuk miring, dan <b>Enter</b> untuk baris baru.",
        { icon: "💡" }
      ),
      B("h2", "Satu halaman, banyak format"),
      B("bullet", "Dokumen &amp; catatan harian dengan format kaya"),
      B("bullet", "Tabel yang bisa ditambah baris dan kolom sesuka hati"),
      B("bullet", "Rumus matematika yang hasilnya dihitung seketika"),
      B("bullet", "Mode presentasi — halaman apa pun bisa jadi slide"),
      B("h2", "Coba interaksinya"),
      B("todo", "Centang tugas ini", { checked: true }),
      B("todo", "Arahkan kursor ke kiri blok untuk menambahkan / mengatur blok"),
      B("todo", "Klik tombol <b>Presentasikan</b> di kanan atas"),
      B("quote", "Alat terbaik adalah yang menghilang — tinggal kamu dan idemu."),
      B("h2", "Rumus hidup"),
      B("formula", "(1250000 * 12) * 1.06"),
      B("formula", "sqrt(144) + 2^5"),
      B("text", "Dukungan: <code>sqrt() sin() cos() log() ln() min() max() abs()</code>, konstanta <code>pi</code> dan <code>e</code>, serta operator <code>+ - * / ^ %</code>."),
      B("h2", "Tabel yang bisa diedit"),
      B(
        "table",
        "",
        {
          rows: [
            ["Konten", "Target", "Realisasi"],
            ["Dokumen", "12", "14"],
            ["Tabel", "4", "6"],
            ["Rumus", "8", "9"],
          ],
        }
      ),
      B("text", "Kolom berisi angka otomatis diberi total <b>Σ</b> di bagian bawah."),
      B("h2", "Potongan kode"),
      B(
        "code",
        "// sapaan dari pratamalab\nconst sapa = (nama) => `Halo, ${nama}! 👋`;\n\nconsole.log(sapa(\"Penulis\"));",
        { lang: "js" }
      ),
      B("divider"),
      B("text", "Semua yang kamu tulis tersimpan otomatis di peramban ini. Selamat berkarya 🌱"),
    ],
  };

  const meeting: Page = {
    id: uid(),
    icon: "🚀",
    title: "Rapat Produk — Sprint 12",
    updatedAt: now - 1000 * 60 * 60 * 5,
    blocks: [
      B("h1", "Rapat Produk — Sprint 12"),
      B("text", "Selasa, 09.30 · Ruang Nuri · Notulen: <b>Dina</b>"),
      B("h2", "Agenda"),
      B("numbered", "Review metrik peluncuran fitur rumus"),
      B("numbered", "Demo mode presentasi ke tim riset"),
      B("numbered", "Perencanaan sprint berikutnya"),
      B("h2", "Catatan diskusi"),
      B("bullet", "Adopsi tabel naik <b>38%</b> sejak rilis kolom total otomatis"),
      B("bullet", "Tim riset meminta ekspor JSON — disepakati masuk sprint depan"),
      B("bullet", "Butuh panduan keyboard singkat untuk pengguna baru"),
      B(
        "callout",
        "Keputusan: mode presentasi dirilis untuk semua halaman minggu ini, tanpa pengecualian.",
        { icon: "📌" }
      ),
      B("h2", "Aksi lanjutan"),
      B("todo", "Dina — menyusun draf panduan pintasan keyboard", { checked: true }),
      B("todo", "Raka — menyiapkan metrik dashboard Q3", { checked: true }),
      B("todo", "Sari — menguji mode presentasi di 5 dokumen nyata"),
      B("todo", "Bimo — menulis changelog rilis 0.9"),
      B("quote", "Rapat yang baik berakhir dengan keputusan, bukan wacana."),
    ],
  };

  const budget: Page = {
    id: uid(),
    icon: "🧮",
    title: "Anggaran Riset Q3",
    updatedAt: now - 1000 * 60 * 60 * 26,
    blocks: [
      B("h1", "Anggaran Riset Q3"),
      B(
        "callout",
        "Angka di bawah masih proyeksi. Finalisasi menunggu persetujuan finance tanggal 28.",
        { icon: "⚠️" }
      ),
      B("h2", "Proyeksi utama"),
      B("formula", "84000000"),
      B("formula", "61500000"),
      B("formula", "(84000000 - 61500000) / 84000000 * 100"),
      B("h2", "Rincian per kategori"),
      B(
        "table",
        "",
        {
          rows: [
            ["Kategori", "Anggaran", "Realisasi", "Sisa"],
            ["Alat laboratorium", "25000000", "23400000", "1600000"],
            ["Bahan habis pakai", "18000000", "17150000", "850000"],
            ["Langganan perangkat lunak", "9500000", "9500000", "0"],
            ["Perjalanan dinas", "9000000", "6200000", "2800000"],
          ],
        }
      ),
      B("h2", "Catatan"),
      B("bullet", "Realisasi bahan habis pakai lebih hemat berkat vendor baru"),
      B("bullet", "Sisa perjalanan dinas bisa dialihkan ke konferensi November"),
      B("todo", "Minta penawaran ulang untuk langganan tahunan"),
      B("todo", "Rekap kuitansi alat laboratorium", { checked: true }),
    ],
  };

  const ideas: Page = {
    id: uid(),
    icon: "💡",
    title: "Papan Ide",
    updatedAt: now - 1000 * 60 * 60 * 49,
    blocks: [
      B("h1", "Papan Ide"),
      B("quote", "Catat dulu, nilai belakangan. Ide terbaik sering datang tanpa permisi."),
      B("h2", "Eksperimen minggu ini"),
      B("numbered", "Mode fokus: sembunyikan sidebar saat menulis panjang"),
      B("numbered", "Tautan antar-halaman ala wiki internal"),
      B("numbered", "Tema gelap untuk kerja malam"),
      B("h2", "Referensi"),
      B("bullet", "Studi: <i>How people organize second-brain tools</i> (2024)"),
      B("bullet", "Wawancara 5 pengguna beta tentang menu blok"),
      B(
        "callout",
        "Ide paling gila bulan ini: halaman yang menulis rangkuman dirinya sendiri.",
        { icon: "🔥" }
      ),
      B("text", "Tambahkan idemu di bawah ini — jangan sungkan."),
    ],
  };

  return { pages: [welcome, meeting, budget, ideas], activeId: welcome.id };
}
