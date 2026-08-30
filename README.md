# Pratamalab

Workspace blok modern untuk dokumen, tabel, rumus, kode, dan presentasi. Aplikasi bisa langsung dipakai dalam mode lokal tanpa database, lalu dihubungkan ke Supabase/PostgreSQL untuk autentikasi, penyimpanan cloud, presence, dan sinkronisasi realtime.

## Fitur

- **Editor blok** — ketik `/` untuk menyisipkan 13 jenis blok (teks, judul, daftar tugas, poin, nomor, kutipan, sorotan, rumus, tabel, kode, garis pembatas).
- **Pintasan markdown** — `# `, `- `, `1. `, `[] `, `> `, ` ``` `, `---` langsung berubah menjadi bloknya.
- **Tabel interaktif** — tambah/kurang baris & kolom, sel dapat diedit, kolom angka otomatis diberi total **Σ**.
- **Blok rumus** — parser matematika aman (`sqrt`, `sin/cos/tan`, `log`, `min/max`, `pow`, `pi`, `e`, operator `+ - * / ^ %`), hasil terhitung seketika.
- **Mode presentasi** — ubah halaman apa pun menjadi slide; Judul 1/2 menjadi pemisah slide, navigasi `← →`, keluar dengan `Esc`.
- **Blok kode** — dengan pilihan bahasa dan tombol salin.
- **Manajemen halaman** — cari, buat, hapus (konfirmasi dua langkah), ganti ikon & judul.
- **Simpan otomatis** — `localStorage` dalam mode lokal, Supabase/PostgreSQL dalam mode cloud.
- **Ekspor** — Markdown, HTML aman, JSON, CSV untuk blok tabel, dan PDF melalui dialog cetak.
- **Kolaborasi** — presence dan sinkronisasi blok realtime ketika Supabase dikonfigurasi.

## Menjalankan di Laragon

Buka Terminal Laragon pada folder proyek ini, lalu jalankan:

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Nilai placeholder atau kosong di `.env.local` otomatis mengaktifkan mode lokal, jadi halaman demo dapat langsung dibuat dan diedit tanpa login atau database.

Build produksi:

```bash
npm run build
npm run preview
```

Build produksi berada di `dist/`.

## Mengaktifkan database dan kolaborasi

Backend aplikasi menggunakan Supabase (PostgreSQL + Auth + Realtime), bukan MySQL Laragon.

1. Buat proyek Supabase.
2. Jalankan seluruh isi `supabase/migrations/001_init.sql` di SQL Editor Supabase.
3. Salin `.env.example` menjadi `.env.local`, lalu isi URL proyek dan **anon/publishable key**. Jangan pernah memakai `service_role` key di frontend.
4. Di Supabase Auth URL Configuration, tambahkan `http://localhost:3000` sebagai Site URL dan redirect URL.
5. Jalankan ulang `npm run dev`, daftar akun, lalu login.

Skema mengaktifkan Row Level Security untuk profil, workspace, halaman, blok, komentar, dan tautan berbagi. Workspace pertama beserta membership owner dibuat otomatis dan atomik melalui trigger database.

## Verifikasi

```bash
npm run typecheck
npm run build
```

## Tech stack

React 18 · TypeScript · Vite · Tailwind CSS v4

## Lisensi

MIT
