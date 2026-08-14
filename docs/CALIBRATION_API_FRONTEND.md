# Kontrak API Frontend — Calibration Report

Base URL: `/api`  
Authentication untuk seluruh endpoint calibration: `Authorization: Bearer <access_token>`  
Role `adm` atau `eng` dapat mengakses data dan mengelola draft. Hanya `adm` yang dapat approve report.

Semua nilai tanggal menggunakan format date-only ISO: `YYYY-MM-DD`. Nilai desimal dikirim sebagai JSON number, bukan string berformat lokal (gunakan `12.79`, bukan `12,79`).

## Alur frontend

1. Login dan simpan `access_token`.
2. `GET /calibrations/parameters` untuk mengisi checklist parameter dari master; jangan hard-code ID.
3. `POST /calibrations` untuk membuat draft. Simpan metadata hasilnya: `id`, `report_no`, `status`, dan `verification_uuid`.
4. `GET /calibrations/{id}`. Endpoint ini mengembalikan station yang sudah terelasi, QR code backend, seluruh `detail.id`, dan `standards[].id`.
5. Tampilkan dan autosave dengan `PUT /calibrations/{id}`. Untuk edit berikutnya gunakan ID yang diterima dari langkah 4.
6. Setelah semua hasil larutan terisi, panggil `POST /calibrations/{id}/submit`.
7. Role `adm` dapat approve dengan `POST /calibrations/{id}/approve`.
8. Report PDF tersedia di `GET /calibrations/{id}/print`.

`station_id`, `report_no`, `status`, `verification_uuid`, ID detail, dan ID standard **bukan input manual UI**. Server membuatnya dan frontend menyimpan nilai respons untuk navigasi/edit berikutnya.

## 1. Login

`POST /auth/login`

```json
{
  "username": "febry",
  "password": "1234"
}
```

Respons sukses:

```json
{
  "success": true,
  "user_data": {
    "user_id": 10,
    "username": "febry",
    "fullname": null,
    "role_id": "adm"
  },
  "token": {
    "access_token": "<jwt>",
    "expires_in": 3600,
    "type": "Bearer"
  }
}
```

`officer_id` tidak dikirim frontend saat membuat calibration. Nilai tersebut selalu berasal dari user JWT login. Detail report menampilkan `officer_name` dari username user tersebut.

## 2. Master parameter untuk checklist

`GET /calibrations/parameters`

Endpoint ini wajib dipanggil sebelum create draft. Endpoint membutuhkan role `adm` atau `eng` dan mengembalikan ID yang berlaku pada environment aktif, nama parameter, unit, serta solution standard tetap.

```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "name": "DO",
      "unit": "mg/L",
      "standards": [
        { "crm_name": "0", "crm_standard_value": 0 },
        { "crm_name": "100", "crm_standard_value": 100 }
      ]
    },
    {
      "id": 4,
      "name": "TDS",
      "unit": "mg/L",
      "standards": [
        { "crm_name": "1.413", "crm_standard_value": 1.413 },
        { "crm_name": "12.89", "crm_standard_value": 12.89 }
      ]
    },
    {
      "id": 1,
      "name": "Suhu",
      "unit": "°C",
      "standards": []
    }
  ]
}
```

Gunakan hanya parameter calibration yang dipilih user sebagai `parameter_ids` pada create. `standards: []` berarti parameter tersebut tidak memiliki master larutan kalibrasi.

## 3. Membuat draft

`POST /calibrations`

Input wajib:

```json
{
  "station_id": 7,
  "calibration_start_date": "2026-08-10",
  "calibration_end_date": "2026-08-11",
  "parameter_ids": [2, 3, 4, 5, 7, 8, 9, 10, 11, 12]
}
```

| Field | Tipe | Aturan frontend |
| --- | --- | --- |
| `station_id` | number | ID master station yang dipilih. Untuk KLHK299, hasil test menunjukkan ID `7`; jangan hard-code ID ini untuk environment lain. |
| `calibration_start_date` | string | Wajib, `YYYY-MM-DD`. |
| `calibration_end_date` | string | Wajib, harus sama atau setelah start date. |
| `parameter_ids` | number[] | Wajib dan minimal satu parameter. Urutan bebas. |

`contact_person`, `phone`, dan `officer_id` tidak dikirim.

Respons sukses (`200 OK`):

```json
{
  "success": true,
  "message": "Calibration draft created successfully",
  "data": {
    "id": "fb9beea0-d0e1-4716-91a7-0cb9d0afe72a",
    "report_no": "CR-2026/VIII/OMS-CMC/003",
    "station_id": 7,
    "calibration_start_date": "2026-08-10",
    "calibration_end_date": "2026-08-11",
    "notes": null,
    "officer_id": 10,
    "status": "draft",
    "verification_uuid": "b7dcbd4e-2237-46a2-85e3-fe3d70877155",
    "verification_url": "https://api.example.com/api/verify/b7dcbd4e-2237-46a2-85e3-fe3d70877155",
    "qr_code_data_url": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "created_at": "2026-08-13T10:00:00.000Z",
    "updated_at": "2026-08-13T10:00:00.000Z"
  }
}
```

Gunakan `data.id` sebagai `{id}` pada seluruh endpoint berikutnya. Setelah create, selalu panggil detail; respons create belum memuat ID detail dan ID standard.

## 4. Mendapatkan data form untuk ditampilkan/edit

`GET /calibrations/{id}`

Respons detail memiliki tiga kelompok data:

```json
{
  "success": true,
  "data": {
    "id": "fb9beea0-d0e1-4716-91a7-0cb9d0afe72a",
    "report_no": "CR-2026/VIII/OMS-CMC/003",
    "station_id": 7,
    "calibration_start_date": "2026-08-10",
    "calibration_end_date": "2026-08-11",
    "status": "draft",
    "verification_uuid": "b7dcbd4e-2237-46a2-85e3-fe3d70877155",
    "notes": null,
    "station_name": "KLHK299",
    "station_address": "Pintu Air Tapodu BBWS, Tilango, Kabupaten Gorontalo, Gorontalo",
    "station_coordinate": "LAT 0.92555 | LONG 123.031292",
    "station_city": "Kabupaten Gorontalo",
    "officer_name": "febry",
    "details": [
      {
        "id": 54,
        "calibration_id": "fb9beea0-d0e1-4716-91a7-0cb9d0afe72a",
        "parameter_id": 4,
        "parameter_name": "TDS",
        "parameter_unit": "mg/L",
        "coeff_type": null,
        "coefficients": null,
        "crm_reference_value": null,
        "crm_reading_value": null,
        "calculation_result": null,
        "remark": null,
        "standards": [
          {
            "id": 82,
            "calibration_detail_id": 54,
            "crm_name": "1.413",
            "crm_standard_value": 1.413,
            "min_acceptable": null,
            "max_acceptable": null,
            "calibration_result": null
          },
          {
            "id": 83,
            "calibration_detail_id": 54,
            "crm_name": "12.89",
            "crm_standard_value": 12.89,
            "min_acceptable": null,
            "max_acceptable": null,
            "calibration_result": null
          }
        ]
      }
    ],
    "waterSamples": []
  }
}
```

### Field yang ditampilkan tetapi tidak boleh diedit langsung

| Field | Sumber | Perlakuan UI |
| --- | --- | --- |
| `station_name`, `station_address`, `station_coordinate`, `station_city` | master station | Read-only. Address dan coordinate tidak dikirim pada create/update. |
| `officer_name` | user JWT | Read-only. |
| `report_no` | server | Read-only. |
| `status` | workflow server | Read-only. |
| `verification_uuid` | server | Read-only; dapat dipakai untuk link verifikasi publik `/api/verify/{verification_uuid}`. |
| `verification_url` | backend | Read-only. URL publik yang menjadi isi QR code. Gunakan langsung bila ingin menampilkan tombol/link verifikasi. |
| `qr_code_data_url` | backend | Read-only. Data URL PNG hasil generate backend; gunakan langsung sebagai `src` gambar preview. |
| `standards[].crm_standard_value` | master solution | Read-only. Jangan menggantinya dengan `calibration_result`. |
| `calculation_result`, `remark`, `standards[].min_acceptable`, `standards[].max_acceptable` | server | Tampilkan hasil server; jangan hitung/simpan sebagai nilai otoritatif di frontend. |

`details[].id` dan `details[].standards[].id` wajib disimpan pada state form. Keduanya digunakan saat autosave. `waterSamples[].id` baru tersedia setelah sample pertama disimpan.

### Menampilkan QR code pada preview frontend

Tidak perlu package QR di frontend. Backend mengirim `qr_code_data_url` pada respons detail:

```tsx
<img
  src={detail.qr_code_data_url}
  alt={`QR verifikasi ${detail.report_no}`}
  width={180}
  height={180}
/>
```

QR tersebut berisi persis `verification_url`. Bila domain yang tersedia adalah domain frontend, atur backend:

```env
PUBLIC_CALIBRATION_FRONTEND_URL=https://app.example.com
```

Hasil QR menjadi `https://app.example.com/verify/{verification_uuid}`. Route frontend `/verify/:uuid` kemudian mengambil data publik dari backend dengan `GET https://api.example.com/api/verify/:uuid`.

`PUBLIC_CALIBRATION_BASE_URL=https://api.example.com/api` tetap didukung sebagai fallback untuk deployment yang ingin QR langsung membuka halaman verifikasi backend.

## 5. Autosave / edit detail laporan

`PUT /calibrations/{id}`

Semua field payload bersifat opsional, tetapi bila mengirim `waterSamples`, kirim **seluruh** sample yang ingin dipertahankan. Server menyinkronkan koleksi: sample existing yang ID-nya tidak ada di payload akan dihapus.

Contoh payload lengkap memakai ID dari `GET /calibrations/{id}`:

```json
{
  "calibration_start_date": "2026-08-10",
  "calibration_end_date": "2026-08-11",
  "notes": "<ul><li>Sensor dibersihkan</li></ul>",
  "details": [
    {
      "id": 52,
      "coeff_type": "K/B",
      "coefficients": { "K": 0.999110, "B": -0.000024 },
      "crm_reference_value": 5.51,
      "crm_reading_value": 3.14,
      "standards": [
        { "id": 78, "crm_name": "0", "calibration_result": 0 },
        { "id": 79, "crm_name": "100", "calibration_result": 99.84 }
      ]
    },
    {
      "id": 55,
      "coeff_type": "K1-K6",
      "coefficients": {
        "K1": -58.77783,
        "K2": -58.77783,
        "K3": -21.16125,
        "K4": -58.77783,
        "K5": -58.77783,
        "K6": -15.39816
      },
      "crm_reference_value": null,
      "crm_reading_value": null,
      "standards": [
        { "id": 84, "crm_name": "4", "calibration_result": 3.97 },
        { "id": 85, "crm_name": "7.01", "calibration_result": 6.83 },
        { "id": 86, "crm_name": "10.01", "calibration_result": 10.00 }
      ]
    }
  ],
  "waterSamples": [
    {
      "sample_name": "Aquades (Blank)",
      "suhu": 25.0,
      "do": 8.77,
      "tur": 0.00,
      "tds": 0.00,
      "ph": 6.96,
      "orp": null,
      "tss": 0.00,
      "bod": 0.00,
      "cod": 0.00,
      "amonia": 0.00,
      "nitrat": 0.00,
      "nitrit": 0.00,
      "kedalaman": null
    }
  ]
}
```

Untuk edit berikutnya, sertakan ID sample dari respons detail:

```json
{
  "waterSamples": [
    {
      "id": 31,
      "sample_name": "Aquades (Blank)",
      "suhu": 25.0,
      "do": 8.77,
      "tur": 0,
      "tds": 0,
      "ph": 6.96,
      "orp": null,
      "tss": 0,
      "bod": 0,
      "cod": 0,
      "amonia": 0,
      "nitrat": 0,
      "nitrit": 0,
      "kedalaman": null
    }
  ]
}
```

### Kontrak `details[]`

| Field | Tipe | Kirim dari frontend | Keterangan |
| --- | --- | --- | --- |
| `id` | number | Ya, setelah detail didapat dari GET | ID detail untuk update. |
| `coeff_type` | `"K/B"`, `"K1-K6"`, atau omit | Ya bila tersedia | pH memakai `K1-K6`; Nitrat/Nitrit tidak memiliki coefficient pada sample, sehingga field ini di-omit. |
| `coefficients` | object atau omit | Ya bila tersedia | Key boleh uppercase; server menyimpannya lowercase (`k`, `b`, `k1`–`k6`). Jangan kirim nilai rekaan. |
| `crm_reference_value` | number atau `null` | Ya | pH harus `null`. |
| `crm_reading_value` | number atau `null` | Ya | pH harus `null`. |
| `standards` | array | Ya | Hanya kirim nama Solution dari respons server/master. |

### Kontrak `details[].standards[]`

| Field | Tipe | Keterangan |
| --- | --- | --- |
| `id` | number | ID standard untuk update/autosave. |
| `crm_name` | string | Label standard siap tampil, identik dengan nilai master, contoh `"0"`, `"100"`, atau `"1.413"`. Kirim kembali apa adanya saat autosave. |
| `calibration_result` | number atau `null` | Input pembacaan engineer. Nilai decimal diperbolehkan. |

Solution standard bersifat tetap:

| Parameter | `crm_standard_value` dari server |
| --- | --- |
| DO | `0`, `100` |
| Turbidity | `4`, `20` |
| TDS | `1.413`, `12.89` |
| pH | `4.00`, `7.01`, `10.01` |
| TSS | `50` |
| BOD / COD | `10`, `100` |
| Amonia | `1` |
| Nitrat / Nitrit | `10`, `100` |

`crm_name` selalu merupakan representasi string dari `crm_standard_value`; contoh respons DO adalah `{ "crm_name": "0", "crm_standard_value": 0 }`. Dengan demikian frontend cukup menampilkan `crm_name` (atau `crm_standard_value` bila memerlukan number) tanpa memetakan `Solution 1/2/3` lagi.

Respons sukses autosave:

```json
{
  "success": true,
  "message": "Calibration draft updated successfully",
  "data": {
    "id": "fb9beea0-d0e1-4716-91a7-0cb9d0afe72a",
    "status": "draft",
    "updated_at": "2026-08-13T10:05:00.000Z"
  }
}
```

Setelah autosave, panggil kembali `GET /calibrations/{id}` bila UI membutuhkan calculation result, batas penerimaan, atau ID water sample terbaru.

## 6. Mengubah daftar parameter

Masukkan `parameter_ids` ke payload `PUT /calibrations/{id}`:

```json
{
  "parameter_ids": [2, 3, 4, 5, 7, 8, 9, 10, 11, 12]
}
```

Server membuat detail serta solution standard untuk parameter baru, dan menghapus detail/standard parameter yang tidak terdapat pada daftar. Setelah itu frontend **harus** menjalankan GET detail ulang karena ID detail dan standard dapat berubah.

## 7. Submit, approve, print, dan verifikasi

| Endpoint | Input | Respons sukses | Catatan |
| --- | --- | --- | --- |
| `POST /calibrations/{id}/submit` | Tanpa body | `{ "data": { "id": "...", "status": "submitted" } }` | Semua `calibration_result` untuk semua standard wajib terisi. Server menghitung dan menyimpan `details[].calculation_result` (`PASS`/`FAILED`) secara atomik sebelum mengubah status. Draft tidak lagi dapat diedit. |
| `POST /calibrations/{id}/approve` | Tanpa body | `{ "data": { "id": "...", "status": "approved" } }` | Hanya role `adm` dan hanya untuk report berstatus `submitted`. Role `eng` menerima 401. |
| `GET /calibrations/{id}/print` | - | `application/pdf` | Mengunduh/menampilkan PDF laporan. Endpoint ini public pada implementasi saat ini. Header unduhan adalah `Content-Disposition: attachment; filename="Laporan_Kalibrasi_<safe-report-number>.pdf"`. Error teks endpoint ini: `Laporan kalibrasi tidak ditemukan.`, `Template laporan kalibrasi tidak ditemukan.`, atau `Gagal membuat PDF laporan kalibrasi.`. |
| `GET /verify/{verification_uuid}` | - | JSON atau HTML | Endpoint backend public yang dipanggil halaman frontend `/verify/:uuid`. |

### Water sample di UI dan report

Frontend perlu menyediakan field `orp`, `nitrit`, dan `kedalaman` sebagai input opsional (`number` atau `null`), bersamaan dengan field water sample lainnya. Ketiganya disimpan serta dikembalikan API pada setiap `waterSamples[]`.

Tabel preview dan PDF kini juga menampilkan kolom **ORP (mV)**, **NO2-N / Nitrit (mg/L)**, dan **Kedalaman (m)**. Nilai `null` tampil sebagai `-`.

## Error yang perlu ditangani frontend

| Kondisi | HTTP umum | Pesan server |
| --- | --- | --- |
| Token tidak ada/tidak valid | 401 | `Access token invalid!` atau `Access token expired or invalid` |
| End date sebelum start date | 400 | `calibration_end_date must be on or after calibration_start_date.` |
| Draft tidak ditemukan | 404 | `Calibration report not found` |
| Autosave pada non-draft | 400 | `Only drafts can be updated` |
| Submit tanpa nilai result | 400 | `Calibration result for CRM standard '<nilai-standard>' is missing.` |
| Submit tanpa parameter | 400 | `Cannot submit calibration with no parameters selected.` |
