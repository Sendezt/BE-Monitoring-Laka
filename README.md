# Monitoring Laka Backend

Aplikasi backend untuk monitoring data menggunakan Google Sheets API. Sistem ini menghubungkan Express.js dengan Google Sheets untuk mengambil dan mengelola data monitoring secara real-time.

## 🚀 Fitur

- API REST untuk mengakses data dari Google Sheets
- Integrasi autentikasi Google Service Account
- CORS support untuk permintaan dari berbagai origin
- Struktur modular dengan separation of concerns (Controllers, Services, Routes)
- Environment configuration menggunakan dotenv

## 📋 Prerequisites

- Node.js (v14 atau lebih tinggi)
- npm atau yarn
- Google Cloud Project dengan API Google Sheets v4 aktif
- Service Account credentials JSON file

## 🔧 Instalasi

1. Clone repository atau download project:

```bash
cd monitoring-laka-be
```

2. Install dependencies:

```bash
npm install
```

3. Setup environment variables:
   - Buat file `.env` di root directory
   - Tambahkan konfigurasi yang diperlukan:

```env
PORT=3001
NODE_ENV=development
```

4. Setup Google Credentials:
   - Letakkan file `credential.json` di folder `credentials/`
   - Pastikan file berisi Google Service Account credentials yang valid

## 🏃 Menjalankan Aplikasi

### Development Mode (dengan hot reload):

```bash
npm run dev
```

### Production Mode:

```bash
npm start
```

Server akan berjalan di `http://localhost:3001`

## 📁 Struktur Project

```
monitoring-laka-be/
├── src/
│   ├── app.js                 # Entry point aplikasi
│   ├── config/
│   │   └── google.js          # Google Sheets API configuration
│   ├── controllers/
│   │   └── card.controller.js # Business logic untuk card
│   ├── routes/
│   │   └── card.route.js      # Route definitions
│   └── services/
│       └── spreadsheet.service.js # Service untuk interaksi Sheets
├── credentials/
│   └── credential.json # Google credentials
├── package.json               # Dependencies dan scripts
└── README.md                  # Dokumentasi project
```

## 📡 API Endpoints

### Health Check

```
GET /
Response: { message: "Spreadsheet API is running" }
```

### Card Endpoints

```
GET /api/card          # Mengambil semua data card
POST /api/card         # Membuat card baru
GET /api/card/:id      # Mengambil data card spesifik
PUT /api/card/:id      # Update card
DELETE /api/card/:id   # Hapus card
```

### Swagger Documentation

```
GET /api-test          # Akses dokumentasi API Swagger UI
```

**Akses Swagger UI**: http://localhost:3001/api-test

Swagger menyediakan dokumentasi interaktif untuk semua API endpoints, termasuk:

- Detail parameter request dan response
- Contoh data (request/response body)
- Kemampuan untuk test API langsung dari browser

## 🛠️ Technologies Used

- **Express.js** - Web framework untuk Node.js
- **Google APIs** - googleapis v174.0.1 untuk integrasi Google Sheets
- **CORS** - Cross-Origin Resource Sharing middleware
- **dotenv** - Environment variable management
- **Nodemon** - Development tool untuk auto-restart
- **Swagger UI Express** - API documentation dengan Swagger UI
- **Swagger JSDoc** - Generate Swagger docs dari JSDoc comments

## 📝 Environment Variables

| Variable | Default     | Deskripsi        |
| -------- | ----------- | ---------------- |
| PORT     | 3001        | Port server      |
| NODE_ENV | development | Environment mode |

## 🔐 Security

- Gunakan Service Account credentials yang aman
- Jangan commit file `.env` dan credentials JSON ke repository
- Tambahkan kedua file ke `.gitignore`

Contoh `.gitignore`:

```
node_modules/
.env
credentials/
.DS_Store
```

## 🤝 Contributing

1. Buat branch baru untuk fitur Anda
2. Commit perubahan dengan pesan yang jelas
3. Push ke branch dan buat Pull Request

## 📄 License

ISC License - Lihat package.json untuk detail

## 📧 Kontak

Untuk pertanyaan atau issues, silakan buka issue di repository ini.

---

**Last Updated**: 2026-08-14


test commit