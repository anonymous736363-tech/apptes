# User Management Dashboard

Sistem login dan manajemen user dengan tracking aktivitas real-time menggunakan Supabase.

## Fitur Utama

### 1. Autentikasi
- Login dan Register dengan email/password
- Session management otomatis
- Auto-create profile saat register

### 2. Dashboard Real-time
- Tracking user online/offline secara real-time
- Statistik jumlah user aktif
- Daftar semua user yang terdaftar
- Status online/offline setiap user

### 3. Activity Tracking
- Log semua aktivitas user (login, logout, dll)
- Feed aktivitas real-time
- History aktivitas 24 jam terakhir

### 4. Notifikasi
- System notifikasi untuk user
- Badge untuk notifikasi yang belum dibaca
- Mark as read functionality

### 5. Fitur Tambahan
- Dark mode / Light mode toggle
- User profile dengan avatar (initial)
- Responsive design untuk semua device
- Real-time updates menggunakan Supabase Realtime

## Setup Database

1. Buka Supabase SQL Editor
2. Copy dan jalankan SQL dari file `supabase/migrations/001_init_user_system.sql`
3. Migration akan membuat:
   - Tabel `user_profiles`
   - Tabel `user_sessions`
   - Tabel `user_activities`
   - Tabel `notifications`
   - Triggers untuk auto-create profile
   - RLS policies untuk security

## Instalasi & Menjalankan

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build untuk production
npm run build
```

## Environment Variables

File `.env` sudah dikonfigurasi dengan Supabase credentials:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_SUPABASE_ANON_KEY`

## Teknologi

- Vite - Build tool
- Vanilla JavaScript - Frontend
- Supabase - Backend & Database
- @supabase/supabase-js - Supabase client library

## Struktur Database

### user_profiles
- Menyimpan informasi profile user
- Tracking status online/offline
- Timestamps untuk last_seen

### user_sessions
- Tracking session login user
- History session aktif dan tidak aktif

### user_activities
- Log semua aktivitas user
- Menyimpan metadata aktivitas dalam JSONB

### notifications
- Sistem notifikasi untuk user
- Status read/unread

## Security

- Semua tabel menggunakan Row Level Security (RLS)
- User hanya bisa akses data mereka sendiri
- Profile viewable oleh semua authenticated users
- Activities dan sessions private per user
