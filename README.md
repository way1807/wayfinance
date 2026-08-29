# WAYFinance - Panduan Hubung ke Vercel

Repositori ini telah dikonfigurasi untuk langsung dideploy ke **Vercel** dengan pengaturan optimasi dan keamanan dasar.

## File Konfigurasi yang Ditambahkan:
1. `vercel.json` (file:///d:/Gawe/Web%20_%20WayFinance/vercel.json): Mengatur clean URLs (menghilangkan ekstensi `.html` dari URL), trailing slash, cache control untuk aset gambar/media, dan header keamanan standar (seperti `X-Frame-Options` dan `X-Content-Type-Options`).
2. `.vercelignore` (file:///d:/Gawe/Web%20_%20WayFinance/.vercelignore): Mencegah file cadangan/backup atau file tidak penting terunggah saat proses build.
3. `.gitignore` (file:///d:/Gawe/Web%20_%20WayFinance/.gitignore): Menghindari folder cache lokal Vercel (`.vercel`) masuk ke Git.

---

## Cara Mendeploy ke Vercel

Ada 2 cara utama yang dapat Anda gunakan untuk meluncurkan web ini secara online gratis:

### Cara 1: Menggunakan GitHub (Sangat Direkomendasikan & Otomatis)
Ini adalah cara termudah karena setiap kali Anda memperbarui kode dan melakukan `git push`, situs web Anda di Vercel akan diperbarui secara otomatis.

1. Hubungkan folder ini ke repositori Git online (misalnya GitHub/GitLab).
2. Masuk ke akun Anda di [Vercel](https://vercel.com).
3. Klik tombol **Add New...** dan pilih **Project**.
4. Pilih repositori GitHub Anda yang berisi proyek ini.
5. Pada bagian konfigurasi, biarkan semuanya bawaan (default), lalu klik **Deploy**.
6. Selesai! Web Anda sekarang online dan memiliki domain gratis dari Vercel.

---

### Cara 2: Menggunakan Vercel CLI (Melalui Terminal)
Jika Anda ingin melakukan deploy langsung dari komputer Anda tanpa mengunggah ke GitHub terlebih dahulu:

1. Buka terminal (PowerShell atau Command Prompt) di direktori ini.
2. Instal Vercel CLI secara global (jika belum pernah menginstalnya):
   ```bash
   npm install -g vercel
   ```
3. Jalankan perintah berikut untuk memulai proses deploy:
   ```bash
   vercel
   ```
4. Ikuti panduan di layar terminal (login ke akun Vercel Anda, konfirmasi proyek, dll.).
5. Setelah selesai, jalankan perintah ini untuk mempublikasikan ke production:
   ```bash
   vercel --prod
   ```
