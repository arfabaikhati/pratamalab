# 🧪 Pratamalab

Ruang kerja serba bisa untuk menulis — dokumen, tabel, rumus, kode, hingga presentasi — dalam satu halaman bergaya blok seperti Notion.

## Fitur

- **Editor blok** — ketik `/` untuk menyisipkan 13 jenis blok (teks, judul, daftar tugas, poin, nomor, kutipan, sorotan, rumus, tabel, kode, garis pembatas).
- **Pintasan markdown** — `# `, `- `, `1. `, `[] `, `> `, ` ``` `, `---` langsung berubah menjadi bloknya.
- **Tabel interaktif** — tambah/kurang baris & kolom, sel dapat diedit, kolom angka otomatis diberi total **Σ**.
- **Blok rumus** — parser matematika aman (`sqrt`, `sin/cos/tan`, `log`, `min/max`, `pow`, `pi`, `e`, operator `+ - * / ^ %`), hasil terhitung seketika.
- **Mode presentasi** — ubah halaman apa pun menjadi slide; Judul 1/2 menjadi pemisah slide, navigasi `← →`, keluar dengan `Esc`.
- **Blok kode** — dengan pilihan bahasa dan tombol salin.
- **Manajemen halaman** — cari, buat, hapus (konfirmasi dua langkah), ganti ikon & judul.
- **Simpan otomatis** — seluruh data di `localStorage`, tetap ada setelah refresh. Ekspor halaman sebagai JSON.

## Menjalankan lokal

```bash
npm install
npm run dev        # buka http://localhost:5173
```

Build produksi:

```bash
npm run build
npm run preview
```

## Deploy

Hasil build ada di folder `dist/` — bisa langsung dideploy ke **Vercel**, **Netlify**, atau **GitHub Pages** tanpa konfigurasi tambahan.

## Tech stack

React 18 · TypeScript · Vite · Tailwind CSS v4

## Lisensi

MIT
