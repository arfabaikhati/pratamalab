# PratamaLab — Dokumentasi Lengkap

> Notion-like collaborative workspace. Dibangun dengan Laravel 11 (backend API) + Next.js 14 (frontend).
> Dokumen ini adalah panduan utama bagi developer atau AI yang ingin memahami, memodifikasi, atau mengembangkan proyek ini.

---

## Daftar Isi

1. [Gambaran Umum](#1-gambaran-umum)
2. [Tech Stack](#2-tech-stack)
3. [Struktur Folder](#3-struktur-folder)
4. [Arsitektur Sistem](#4-arsitektur-sistem)
5. [Database — Tabel & Kolom](#5-database--tabel--kolom)
6. [Backend — File per File](#6-backend--file-per-file)
7. [Frontend — File per File](#7-frontend--file-per-file)
8. [API Endpoints](#8-api-endpoints)
9. [Real-time (WebSocket)](#9-real-time-websocket)
10. [Panduan Modifikasi](#10-panduan-modifikasi)
11. [Cara Menjalankan](#11-cara-menjalankan)

---

## 1. Gambaran Umum

PratamaLab adalah aplikasi web kolaboratif mirip Notion.com. Pengguna bisa:
- Membuat **workspace** (ruang kerja tim)
- Membuat **pages** (halaman dokumen, spreadsheet, presentasi, dll)
- Menulis konten dengan **block editor** (heading, tabel, kode, rumus, gambar, dll)
- **Kolaborasi real-time** — lihat siapa yang sedang mengedit halaman yang sama
- **Manajemen anggota** workspace dengan role (owner/admin/editor/viewer)

---

## 2. Tech Stack

| Layer | Teknologi | Versi | Fungsi |
|---|---|---|---|
| Backend Framework | Laravel | 11 | REST API, auth, business logic |
| Backend Auth | Laravel Sanctum | 4.x | Token-based authentication (Bearer token) |
| Backend WebSocket | Laravel Reverb | 1.x | WebSocket server untuk real-time |
| Backend Permission | Spatie Permission | 8.x | Role & permission management |
| Database | MySQL | 8.4 | Penyimpanan data utama |
| Frontend Framework | Next.js | 14.2.5 | React framework dengan App Router |
| Frontend Language | TypeScript | 5 | Type safety |
| Frontend Styling | Tailwind CSS | 3.4 | Utility-first CSS |
| Block Editor | BlockNote.js | 0.54 | Notion-like block editor |
| State Management | Zustand | 4.x | Global state (auth, workspace) |
| HTTP Client | Axios | 1.x | API calls dari frontend ke backend |
| Server State | TanStack Query | 5.x | Caching & fetching data |
| Real-time Client | Laravel Echo + Pusher.js | 2.x | Subscribe ke WebSocket channel |
| UI Components | Radix UI | latest | Accessible headless components |
| Notifications | react-hot-toast | 2.x | Toast notifications |

---

## 3. Struktur Folder

```
pratamalab/
├── start.bat                    ← Dobel-klik untuk jalankan semua service
├── START.md                     ← Quick start guide
├── DOKUMENTASI.md               ← File ini
│
├── backend/                     ← Laravel 11 API
│   ├── app/
│   │   ├── Events/              ← WebSocket broadcast events
│   │   │   ├── BlocksUpdated.php
│   │   │   ├── PageUpdated.php
│   │   │   └── UserPresence.php
│   │   ├── Http/
│   │   │   └── Controllers/
│   │   │       └── Api/         ← Semua API controller
│   │   │           ├── AuthController.php
│   │   │           ├── WorkspaceController.php
│   │   │           ├── PageController.php
│   │   │           └── BlockController.php
│   │   └── Models/              ← Eloquent models
│   │       ├── User.php
│   │       ├── Workspace.php
│   │       ├── Page.php
│   │       └── Block.php
│   ├── bootstrap/
│   │   └── app.php              ← Entry point Laravel, middleware config
│   ├── config/
│   │   ├── cors.php             ← CORS settings (allowed origins)
│   │   ├── sanctum.php          ← Auth token config
│   │   ├── reverb.php           ← WebSocket server config
│   │   └── broadcasting.php     ← Broadcasting driver config
│   ├── database/
│   │   ├── migrations/          ← Definisi tabel database
│   │   └── seeders/
│   │       └── DatabaseSeeder.php ← Data demo awal
│   ├── routes/
│   │   ├── api.php              ← Semua 26 API routes
│   │   └── channels.php         ← WebSocket channel authorization
│   └── .env                     ← Konfigurasi environment (DB, Reverb, dll)
│
└── frontend/                    ← Next.js 14 App
    ├── app/                     ← Next.js App Router pages
    │   ├── layout.tsx           ← Root layout (font, metadata)
    │   ├── page.tsx             ← Root redirect → /login
    │   ├── globals.css          ← Global CSS + CSS variables (theme)
    │   ├── providers.tsx        ← React Query + Toast provider
    │   ├── (auth)/              ← Halaman tanpa sidebar
    │   │   ├── login/page.tsx
    │   │   └── register/page.tsx
    │   └── (app)/               ← Halaman dengan auth guard
    │       ├── layout.tsx       ← Auth check (redirect ke login jika belum login)
    │       └── workspace/
    │           └── [workspaceId]/
    │               ├── layout.tsx       ← Load workspace + pages, render sidebar
    │               ├── page.tsx         ← Dashboard workspace (recent pages)
    │               ├── members/
    │               │   └── page.tsx     ← Manajemen anggota workspace
    │               └── page/
    │                   └── [pageId]/
    │                       └── page.tsx ← Block editor halaman
    ├── components/
    │   ├── Sidebar.tsx          ← Sidebar kiri (page tree, nav, user)
    │   ├── PageHeader.tsx       ← Header halaman (icon, title, online users)
    │   └── Editor.tsx           ← BlockNote.js block editor
    ├── lib/
    │   ├── api.ts               ← Axios instance + interceptor (token injector)
    │   ├── echo.ts              ← Laravel Echo WebSocket client setup
    │   └── utils.ts             ← Helper functions (cn, formatDate, dll)
    ├── store/
    │   ├── auth.ts              ← Zustand store: user, token, logout
    │   └── workspace.ts         ← Zustand store: pages, active page, sidebar
    ├── types/
    │   └── index.ts             ← Semua TypeScript interfaces (User, Page, Block, dll)
    ├── .env.local               ← Env vars frontend (API URL, Reverb key)
    ├── next.config.mjs          ← Next.js config + API proxy rewrite
    └── tailwind.config.ts       ← Tailwind theme (warna brand, font, animasi)
```

---

## 4. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│                                                             │
│   Next.js 14 (localhost:3000)                               │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│   │  Login/  │  │Workspace │  │  Page    │  │ Members  │  │
│   │ Register │  │Dashboard │  │ Editor   │  │  Page    │  │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│         │              │            │               │       │
│   ┌─────▼──────────────▼────────────▼───────────────▼───┐  │
│   │              Zustand Stores                          │  │
│   │         auth.ts        workspace.ts                  │  │
│   └──────────────────────────────────────────────────────┘  │
│         │                                    │              │
│   ┌─────▼──────────┐              ┌──────────▼───────────┐  │
│   │   lib/api.ts   │              │    lib/echo.ts        │  │
│   │  Axios + token │              │  Laravel Echo + WS   │  │
│   └─────┬──────────┘              └──────────┬───────────┘  │
└─────────┼───────────────────────────────────┼───────────────┘
          │ HTTP REST                          │ WebSocket
          │ (port 8000)                        │ (port 8080)
┌─────────▼──────────────────────┐  ┌─────────▼───────────────┐
│     Laravel 11 (port 8000)     │  │  Laravel Reverb (8080)  │
│                                │  │                         │
│  routes/api.php (26 endpoints) │  │  routes/channels.php    │
│  ┌──────────┐  ┌────────────┐  │  │  workspace.{uuid}       │
│  │   Auth   │  │ Workspace  │  │  │  page.{uuid}            │
│  │Controller│  │ Controller │  │  │                         │
│  └──────────┘  └────────────┘  │  └─────────────────────────┘
│  ┌──────────┐  ┌────────────┐  │
│  │  Page    │  │   Block    │  │
│  │Controller│  │ Controller │  │
│  └──────────┘  └────────────┘  │
│                                │
│  Sanctum Bearer Token Auth     │
└────────────────┬───────────────┘
                 │ Eloquent ORM
┌────────────────▼───────────────┐
│     MySQL Database             │
│                                │
│  users              blocks     │
│  workspaces         page_collaborators │
│  workspace_members  permissions │
│  pages                         │
└────────────────────────────────┘
```

### Alur Data Utama

```
Register/Login
  → POST /api/auth/register atau /login
  → Laravel kembalikan Bearer token
  → Token disimpan di localStorage + Zustand store
  → Setiap request API berikutnya pakai header: Authorization: Bearer {token}

Buka Halaman Editor
  → GET /api/workspaces/{id}              (load workspace info)
  → GET /api/workspaces/{id}/pages        (load page tree untuk sidebar)
  → GET /api/workspaces/{id}/pages/{id}   (load detail halaman)
  → GET /api/workspaces/{id}/pages/{id}/blocks  (load blok konten)
  → Echo.join("page.{uuid}")              (join WebSocket channel)

Mengetik di Editor
  → BlockNote onChange event
  → Debounce 1.5 detik
  → POST /api/.../blocks/bulk             (simpan semua blok)
  → Reverb broadcast "blocks.updated"     (notify pengguna lain)
```

---

## 5. Database — Tabel & Kolom

### `users`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint PK | Auto increment |
| name | varchar | Nama lengkap |
| email | varchar UNIQUE | Email login |
| password | varchar | Bcrypt hash |
| avatar | varchar NULL | URL foto profil |
| bio | text NULL | Bio singkat |
| timezone | varchar | Default: UTC |
| preferences | json NULL | Pengaturan pribadi (tema, bahasa) |
| last_seen_at | timestamp NULL | Terakhir aktif |
| email_verified_at | timestamp NULL | Verifikasi email |

### `workspaces`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint PK | |
| uuid | char(36) UNIQUE | Public identifier |
| owner_id | FK → users.id | Pemilik workspace |
| name | varchar | Nama workspace |
| slug | varchar UNIQUE | URL-friendly name |
| icon | varchar NULL | Emoji atau URL gambar |
| cover | varchar NULL | URL gambar cover |
| description | text NULL | Deskripsi workspace |
| plan | varchar | free / pro / team |
| settings | json NULL | Pengaturan workspace |

### `workspace_members`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint PK | |
| workspace_id | FK → workspaces.id | |
| user_id | FK → users.id | |
| role | enum | owner / admin / editor / viewer |
| joined_at | timestamp NULL | |

### `pages`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint PK | |
| uuid | char(36) UNIQUE | Public identifier untuk WebSocket |
| workspace_id | FK → workspaces.id | |
| created_by | FK → users.id | Pembuat halaman |
| last_edited_by | FK → users.id NULL | Terakhir mengedit |
| parent_id | FK → pages.id NULL | Untuk nested pages |
| title | varchar | Default: "Untitled" |
| icon | varchar NULL | Emoji halaman |
| cover | varchar NULL | URL gambar cover |
| type | enum | document / database / spreadsheet / presentation / whiteboard |
| is_template | boolean | Apakah template |
| is_favorite | boolean | Di-pin ke favorites |
| is_archived | boolean | Diarsipkan |
| is_locked | boolean | Dikunci (read-only) |
| access | enum | private / workspace / public |
| position | integer | Urutan antar sibling |
| metadata | json NULL | Pengaturan spesifik per tipe |
| last_viewed_at | timestamp NULL | |

### `blocks`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint PK | |
| uuid | char(36) UNIQUE | ID dari BlockNote editor |
| page_id | FK → pages.id | |
| created_by | FK → users.id | |
| parent_block_id | FK → blocks.id NULL | Untuk nested blocks |
| type | varchar | paragraph / heading_1 / table / code / image / dll |
| content | json NULL | Konten teks kaya (rich text array) |
| props | json NULL | Styling: warna, level heading, checked, dll |
| position | integer | Urutan dalam halaman |

**Tipe block yang didukung:**
```
paragraph, heading_1, heading_2, heading_3,
bulleted_list, numbered_list, todo, toggle,
code, quote, callout, divider,
image, video, file, audio, embed,
table, table_row, equation,
column_list, column
```

### `page_collaborators`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint PK | |
| page_id | FK → pages.id | |
| user_id | FK → users.id | |
| permission | enum | view / comment / edit / full |
| cursor | json NULL | Posisi kursor real-time |
| active_at | timestamp NULL | Kapan terakhir aktif di halaman |

---

## 6. Backend — File per File

### `backend/.env`
File konfigurasi environment. **Jangan di-commit ke git.**
```
APP_NAME=PratamaLab
APP_URL=http://localhost:8000
DB_CONNECTION=mysql
DB_DATABASE=pratamalab
DB_USERNAME=root
DB_PASSWORD=
BROADCAST_CONNECTION=reverb
REVERB_APP_KEY=...
REVERB_PORT=8080
```

---

### `backend/routes/api.php`
Mendaftarkan semua 26 API endpoint. Tambahkan route baru di sini.

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout         ← butuh token
GET    /api/auth/me             ← butuh token
PATCH  /api/auth/me             ← butuh token

GET    /api/workspaces          ← list semua workspace user
POST   /api/workspaces          ← buat workspace baru
GET    /api/workspaces/{id}
PATCH  /api/workspaces/{id}
DELETE /api/workspaces/{id}

GET    /api/workspaces/{id}/members
POST   /api/workspaces/{id}/members/invite
DELETE /api/workspaces/{id}/members/{userId}

GET    /api/workspaces/{id}/pages          ← page tree
POST   /api/workspaces/{id}/pages          ← buat halaman baru
GET    /api/workspaces/{id}/pages/archived
POST   /api/workspaces/{id}/pages/reorder
GET    /api/workspaces/{id}/pages/{pageId}
PATCH  /api/workspaces/{id}/pages/{pageId}
DELETE /api/workspaces/{id}/pages/{pageId}
POST   /api/workspaces/{id}/pages/{uuid}/restore

GET    /api/workspaces/{id}/pages/{pageId}/blocks
POST   /api/workspaces/{id}/pages/{pageId}/blocks
POST   /api/workspaces/{id}/pages/{pageId}/blocks/bulk  ← save seluruh halaman
PATCH  /api/workspaces/{id}/pages/{pageId}/blocks/{blockId}
DELETE /api/workspaces/{id}/pages/{pageId}/blocks/{blockId}
```

---

### `backend/routes/channels.php`
Otorisasi WebSocket channel. Memastikan hanya anggota workspace yang bisa join channel.

---

### `backend/app/Models/`

| File | Relasi Utama |
|---|---|
| `User.php` | hasMany Workspaces, belongsToMany Workspaces (via members) |
| `Workspace.php` | belongsTo User (owner), hasMany Pages, belongsToMany Users (members) |
| `Page.php` | belongsTo Workspace, hasMany Children (self-ref), hasMany Blocks |
| `Block.php` | belongsTo Page, hasMany Children (self-ref) |

---

### `backend/app/Http/Controllers/Api/`

| File | Fungsi |
|---|---|
| `AuthController.php` | register, login, logout, me, updateProfile |
| `WorkspaceController.php` | CRUD workspace + invite/remove member |
| `PageController.php` | CRUD pages + tree + reorder + archive/restore |
| `BlockController.php` | CRUD blocks + bulk save (endpoint utama editor) |

---

### `backend/app/Events/`

| File | Di-broadcast ke Channel | Trigger |
|---|---|---|
| `PageUpdated.php` | `page.{uuid}` | Saat judul/icon halaman berubah |
| `BlocksUpdated.php` | `page.{uuid}` | Saat konten blok disimpan |
| `UserPresence.php` | `page.{uuid}` | Saat user join/leave halaman |

---

### `backend/config/cors.php`
Mengatur domain mana yang boleh akses API.
```php
'allowed_origins' => ['http://localhost:3000', 'http://127.0.0.1:3000'],
'supports_credentials' => false,  // pakai token, bukan cookie
```
**Ubah ini jika deploy ke domain lain.**

---

### `backend/config/sanctum.php`
Konfigurasi token auth. Default sudah oke untuk development.

---

### `backend/database/migrations/`
Urutan eksekusi migration penting. Jangan ubah timestamp di nama file.

| File | Tabel yang dibuat |
|---|---|
| `0001_01_01_000000_*` | users |
| `2026_08_29_115355_*` | personal_access_tokens (Sanctum) |
| `2026_08_29_115356_*` | roles, permissions (Spatie) |
| `2026_08_29_115658_*` | workspaces |
| `2026_08_29_115659_*` | workspace_members |
| `2026_08_29_115700_*` | pages |
| `2026_08_29_115701_*` | blocks |
| `2026_08_29_115702_*` | page_collaborators |
| `2026_08_29_115703_*` | kolom tambahan di users |

---

## 7. Frontend — File per File

### `frontend/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_REVERB_APP_KEY=aeymjvli9kx6wvdgumlw
NEXT_PUBLIC_REVERB_HOST=localhost
NEXT_PUBLIC_REVERB_PORT=8080
NEXT_PUBLIC_REVERB_SCHEME=http
```
**Ubah ini saat deploy ke production.**

---

### `frontend/app/globals.css`
Mengatur **tema warna** seluruh aplikasi via CSS variables.
```css
:root {
  --bg: #ffffff;               /* background utama */
  --bg-secondary: #f7f7f5;     /* background sidebar, card */
  --bg-hover: #efefef;         /* hover state */
  --border: #e8e8e6;           /* warna border */
  --text: #1a1a1a;             /* teks utama */
  --text-secondary: #787774;   /* teks sekunder */
  --brand: #3b5bfc;            /* warna aksen brand */
  --sidebar-width: 260px;      /* lebar sidebar */
}
```
**Ubah file ini untuk ganti tema warna atau dark mode.**

---

### `frontend/tailwind.config.ts`
Konfigurasi Tailwind. Warna brand (`brand-50` s/d `brand-950`) didefinisikan di sini.
```ts
colors: {
  brand: {
    600: "#3b5bfc",   // warna tombol utama
    700: "#2a3ef1",   // hover tombol
  }
}
```
**Ubah file ini untuk ganti color palette brand.**

---

### `frontend/types/index.ts`
Semua TypeScript interface. Jika menambah kolom ke database, update interface di sini juga.

```ts
User, Workspace, WorkspaceMember, WorkspaceRole,
Page, PageType, PageAccess,
Block, BlockType,
AuthResponse, ApiError, OnlineUser
```

---

### `frontend/lib/api.ts`
Axios instance dengan:
- `baseURL` → `NEXT_PUBLIC_API_URL/api`
- Interceptor request: otomatis inject `Authorization: Bearer {token}` dari localStorage
- Interceptor response: redirect ke `/login` jika 401

**Semua API call di seluruh aplikasi melalui file ini.**

---

### `frontend/lib/echo.ts`
Setup Laravel Echo untuk WebSocket. Diinisialisasi sekali, lalu dipakai di halaman editor untuk join channel presence.

---

### `frontend/lib/utils.ts`
Helper functions:
- `cn()` — gabung class Tailwind dengan merge
- `formatDate()` — "2 hours ago", "3d ago", dll
- `getInitials()` — "Arfa Surya" → "AS"
- `avatarColor()` — warna avatar konsisten per user ID
- `PAGE_TYPE_ICONS` — mapping tipe halaman ke emoji

---

### `frontend/store/auth.ts`
Zustand store dengan persist (disimpan di localStorage).
```ts
state: { user, token, workspace }
actions: { setAuth(), setWorkspace(), logout(), fetchMe() }
```

---

### `frontend/store/workspace.ts`
Zustand store untuk state workspace aktif.
```ts
state: { workspaces, activeWorkspace, pages, activePage, sidebarOpen }
actions: { fetchPages(), addPage(), updatePage(), removePage(), toggleSidebar() }
```

---

### `frontend/components/Sidebar.tsx`
Sidebar kiri aplikasi. Berisi:
- Header workspace (nama, icon, settings)
- Quick navigation (Search, Home, Members)
- Daftar favorites
- Page tree (nested, bisa expand/collapse)
- Tombol buat page baru
- Footer user (nama, email, logout)

**Ubah file ini untuk mengubah tampilan sidebar.**

---

### `frontend/components/PageHeader.tsx`
Header di atas editor. Berisi:
- Tombol toggle sidebar
- Avatar pengguna yang sedang online (live presence)
- Badge akses halaman (private/workspace/public)
- Emoji picker untuk icon halaman
- Input judul halaman (besar, bold)

**Ubah file ini untuk mengubah tampilan header halaman.**

---

### `frontend/components/Editor.tsx`
Block editor utama menggunakan BlockNote.js.
- Load blok dari API saat pertama buka halaman
- Auto-save debounce 1.5 detik
- Kirim ke `POST /blocks/bulk` saat ada perubahan
- Support semua tipe blok: heading, list, table, code, image, embed, equation, dll

**Ubah file ini untuk kustomisasi editor (tambah tipe blok custom, ubah tema editor, dll).**

---

### `frontend/app/(auth)/login/page.tsx`
Halaman login. Form email + password → `POST /api/auth/login` → simpan token → redirect ke workspace.

### `frontend/app/(auth)/register/page.tsx`
Halaman register. Form name + email + password → `POST /api/auth/register` → auto-create workspace → redirect ke workspace.

### `frontend/app/(app)/layout.tsx`
Auth guard: cek token di Zustand store, redirect ke `/login` jika kosong.

### `frontend/app/(app)/workspace/[workspaceId]/layout.tsx`
Load workspace info + semua pages saat masuk workspace. Render Sidebar.

### `frontend/app/(app)/workspace/[workspaceId]/page.tsx`
Dashboard workspace: tampilkan workspace info + grid recent pages.

### `frontend/app/(app)/workspace/[workspaceId]/members/page.tsx`
Manajemen anggota: list member + form invite + remove member.

### `frontend/app/(app)/workspace/[workspaceId]/page/[pageId]/page.tsx`
Halaman editor utama:
- Fetch data halaman
- Join WebSocket channel (presence)
- Render `<PageHeader>` + `<Editor>`
- Handle real-time update judul dari user lain

---

## 8. API Endpoints

Semua endpoint membutuhkan header:
```
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
```
Kecuali `POST /auth/register` dan `POST /auth/login`.

### Auth
```
POST /api/auth/register     { name, email, password, password_confirmation }
POST /api/auth/login        { email, password }
POST /api/auth/logout
GET  /api/auth/me
PATCH /api/auth/me          { name?, bio?, avatar?, timezone?, preferences? }
```

### Workspaces
```
GET    /api/workspaces
POST   /api/workspaces      { name, icon?, description? }
GET    /api/workspaces/{id}
PATCH  /api/workspaces/{id} { name?, icon?, cover?, description?, settings? }
DELETE /api/workspaces/{id}
```

### Members
```
GET    /api/workspaces/{id}/members
POST   /api/workspaces/{id}/members/invite   { email, role }
DELETE /api/workspaces/{id}/members/{userId}
```

### Pages
```
GET    /api/workspaces/{wid}/pages                         ← page tree
POST   /api/workspaces/{wid}/pages   { title?, type?, parent_id?, icon? }
GET    /api/workspaces/{wid}/pages/{pid}
PATCH  /api/workspaces/{wid}/pages/{pid}  { title?, icon?, is_favorite?, is_archived?, is_locked?, access?, position? }
DELETE /api/workspaces/{wid}/pages/{pid}
GET    /api/workspaces/{wid}/pages/archived
POST   /api/workspaces/{wid}/pages/reorder   { pages: [{id, position}] }
POST   /api/workspaces/{wid}/pages/{uuid}/restore
```

### Blocks
```
GET    /api/workspaces/{wid}/pages/{pid}/blocks
POST   /api/workspaces/{wid}/pages/{pid}/blocks/bulk
       { blocks: [{ uuid, type, content, props, position, parent_block_id? }] }
POST   /api/workspaces/{wid}/pages/{pid}/blocks       { type, content, props, position }
PATCH  /api/workspaces/{wid}/pages/{pid}/blocks/{bid} { type?, content?, props?, position? }
DELETE /api/workspaces/{wid}/pages/{pid}/blocks/{bid}
```

---

## 9. Real-time (WebSocket)

Laravel Reverb berjalan di port 8080.

### Channel yang tersedia

**`workspace.{workspaceUuid}`** — Presence channel workspace
- Event yang diterima: *(belum ada, siap dikembangkan)*

**`page.{pageUuid}`** — Presence channel per halaman
- `page.updated` — judul/icon halaman berubah
- `blocks.updated` — konten blok berubah (trigger reload blok)
- `user.presence` — user join/leave halaman

### Cara subscribe dari frontend
```ts
import { getEcho } from "@/lib/echo";

const echo = getEcho(token);
echo.join(`page.${pageUuid}`)
  .here((users) => { /* daftar user yang online */ })
  .joining((user) => { /* user baru masuk */ })
  .leaving((user) => { /* user keluar */ })
  .listen(".blocks.updated", (e) => { /* reload blok */ });
```

---

## 10. Panduan Modifikasi

### Ubah warna brand / tema
```
frontend/app/globals.css       ← CSS variables utama
frontend/tailwind.config.ts    ← Tailwind color palette
```

### Ubah layout sidebar
```
frontend/components/Sidebar.tsx
```

### Ubah header halaman (icon, title bar)
```
frontend/components/PageHeader.tsx
```

### Tambah tipe block baru di editor
```
frontend/components/Editor.tsx
```
Referensi: https://www.blocknotejs.org/docs/custom-schemas

### Tambah kolom baru ke tabel database
1. Buat migration baru:
   ```bash
   php artisan make:migration add_xxx_to_yyy_table
   ```
2. Isi migration di `backend/database/migrations/`
3. Update model di `backend/app/Models/`
4. Update TypeScript interface di `frontend/types/index.ts`
5. Jalankan: `php artisan migrate`

### Tambah API endpoint baru
1. Buat method di controller yang relevan (`backend/app/Http/Controllers/Api/`)
2. Daftarkan route di `backend/routes/api.php`
3. Buat fungsi API call di frontend menggunakan `api.ts`

### Tambah halaman baru di frontend
1. Buat folder + `page.tsx` di `frontend/app/(app)/workspace/[workspaceId]/namahalaman/`
2. Tambahkan link di `frontend/components/Sidebar.tsx`

### Ubah lebar sidebar
```css
/* frontend/app/globals.css */
--sidebar-width: 260px;  /* ubah nilai ini */
```

### Ganti font
```css
/* frontend/app/globals.css */
@import url('https://fonts.googleapis.com/css2?family=NamaFont...');

/* frontend/tailwind.config.ts */
fontFamily: { sans: ["NamaFont", "sans-serif"] }
```

### Konfigurasi untuk production / deploy
1. Update `frontend/.env.local` → ganti `localhost` ke domain asli
2. Update `backend/.env` → ganti `APP_URL`, `DB_*`, `REVERB_HOST`
3. Update `backend/config/cors.php` → `allowed_origins` ke domain frontend
4. Jalankan `npm run build` untuk build frontend
5. Jalankan `php artisan config:cache` untuk cache config Laravel

---

## 11. Cara Menjalankan

### Otomatis (1 klik)
Dobel-klik file `start.bat` di root folder. Akan membuka terminal untuk Reverb, Queue, dan Frontend.

> **Catatan:** Backend Laravel di-serve langsung oleh **Nginx** — tidak perlu `php artisan serve`.
> Pastikan Laragon sudah running (MySQL + Nginx aktif).

### URL Akses

| Service | Via localhost | Via Nginx domain |
|---|---|---|
| Frontend | http://localhost:3000 | http://app.pratamalab.test |
| Backend API | http://localhost:8000 (artisan serve) | http://pratamalab.test |
| WebSocket | localhost:8080 | ws://ws.pratamalab.test |

### Manual (3 terminal saja)

**Terminal 1 — WebSocket Reverb:**
```bash
cd C:/laragon/www/pratamalab/backend
php artisan reverb:start
```

**Terminal 2 — Queue Worker:**
```bash
cd C:/laragon/www/pratamalab/backend
php artisan queue:work
```

**Terminal 3 — Frontend Next.js:**
```bash
cd C:/laragon/www/pratamalab/frontend
npm run dev
```

Buka browser: **http://app.pratamalab.test** atau **http://localhost:3000**

### Demo Account
- Email: `demo@pratamalab.com`
- Password: `password`

### Reset database (jika perlu mulai ulang)
```bash
cd C:/laragon/www/pratamalab/backend
php artisan migrate:fresh --seed
```

---

*Dokumentasi ini dibuat otomatis. Update dokumen ini setiap kali ada perubahan arsitektur signifikan.*
