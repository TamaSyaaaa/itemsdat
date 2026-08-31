const express = require('express');
const multer = require('multer');
const { put } = require('@vercel/blob');

const app = express();

// Gunakan Memory Storage karena Vercel tidak mengizinkan simpan file di disk lokal
const upload = multer({ 
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.originalname === 'items.dat') {
            cb(null, true);
        } else {
            cb(new Error('Hanya file items.dat yang diizinkan!'), false);
        }
    }
});

// 1. ENDPOINT UNTUK DOWNLOAD items.dat
app.get('/items.dat', (req, res) => {
    // Karena kita menonaktifkan random suffix saat upload, nama filenya akan selalu statis.
    // Ganti 'YOUR_STORE_ID' nanti dengan ID dari URL Vercel Blob milikmu
    // Contoh URL: https://xyz123.public.blob.vercel-storage.com/items.dat
    const blobUrl = `https://${process.env.BLOB_STORE_ID}.public.blob.vercel-storage.com/items.dat`;
    
    // Alihkan client (bot/game) langsung ke link cloud Vercel Blob
    res.redirect(blobUrl);
});

// 2. ENDPOINT UNTUK UPLOAD / UPDATE
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('Gagal: File tidak ditemukan.');
    }

    try {
        // Upload buffer dari RAM langsung ke Vercel Blob
        const blob = await put('items.dat', req.file.buffer, {
            access: 'public',
            addRandomSuffix: false, // Penting: Ini memastikan file lama tertimpa, bukan membuat file baru dengan ID acak
            token: process.env.BLOB_READ_WRITE_TOKEN // Diambil otomatis dari Environment Variables Vercel
        });

        console.log(`[+] items.dat berhasil diupdate: ${blob.url}`);
        res.send(`Sukses! items.dat berhasil diupload ke: <a href="${blob.url}">${blob.url}</a>`);
    } catch (error) {
        console.error(error);
        res.status(500).send(`Terjadi kesalahan saat upload ke Blob: ${error.message}`);
    }
});

// 3. HALAMAN ADMIN
app.get('/admin', (req, res) => {
    const html = `
        <h2>Upload / Update items.dat (Vercel Serverless)</h2>
        <form action="/upload" method="POST" enctype="multipart/form-data">
            <input type="file" name="file" required accept=".dat" />
            <button type="submit">Update items.dat</button>
        </form>
    `;
    res.send(html);
});

// Wajib untuk Vercel Serverless
module.exports = app;
