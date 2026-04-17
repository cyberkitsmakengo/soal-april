# Solver Pack - NoSQLi Unicode Operator Bypass

## Ringkasan Challenge

Target endpoint login ada di `POST /api/login`.
Aplikasi melakukan filter yang terlihat cukup ketat:

- Menolak key yang diawali `$`
- Menolak key yang mengandung `.`
- Memblokir beberapa string berbahaya

Namun setelah filter, aplikasi melakukan normalisasi unicode pada key objek:

- `＄` (fullwidth dollar sign) diubah menjadi `$`

Artinya payload seperti `{"＄ne": null}` lolos filter awal (karena bukan `$` biasa), lalu berubah menjadi `{"$ne": null}` saat query dieksekusi.

## Akar Kerentanan

Urutan logika rentan:

1. Input difilter secara blacklist (shallow)
2. Input dinormalisasi unicode (mengubah key)
3. Query autentikasi dijalankan dengan objek yang sudah dinormalisasi

Ini menciptakan **NoSQL operator injection** karena operator Mongo-like muncul **setelah** proses filtering.

## PoC Manual

Kirim request berikut ke endpoint login:

```json
{
  "username": {
    "＄ne": null
  },
  "password": {
    "＄ne": null
  }
}
```

Contoh dengan curl:

```bash
curl -s -i 'http://localhost:8080/api/login' \
  -H 'Content-Type: application/json' \
  -d '{"username":{"＄ne":null},"password":{"＄ne":null}}'
```

Jika berhasil, respons akan `ok: true` dan sesi login terset sebagai admin.
Setelah itu akses dashboard untuk melihat flag.

## Catatan Eksploitasi

- Payload gagal jika memakai `$ne` biasa (akan difilter)
- Payload sukses jika memakai `＄ne` (unicode fullwidth)
- Eksploit ini tipikal bypass pada sanitasi berbasis blacklist

## Catatan Hardening

- Gunakan validasi allowlist berbasis skema (tipe ketat)
- Tolak semua nilai non-string pada field kredensial
- Lakukan normalisasi **sebelum** validasi
- Jangan langsung memetakan objek user input ke query database
