/**
 * PERHITUNGAN INDEKS PENCEMARAN AIR (8 PARAMETER)
 * Fitur Baru: Deteksi Parameter Dominan (Index Tertinggi)
 * Data Source: Untitled.json
 */

// --- 1. DEFINISI TIPE DATA ---

interface StationRecord {
  id: number;
  time: string;
  id_stasiun: string;
  bod: string | null;
  cod: string | null;
  tss: string | null;
  tds: string | null;
  ph: string | null;
  do_: string | null;
  n: string | null;     // Amonia
  no3_3: string | null; // Nitrat
}

interface HasilAnalisa {
  id: number;
  waktu: string;
  stasiun: string;
  
  // Detail Index per Parameter
  indexPerParam: {
    Amonia: number;
    BOD: number;
    COD: number;
    DO: number;
    Nitrat: number;
    PH: number;
    TDS: number;
    TSS: number;
  };
  
  // Hasil Akhir
  indeksPencemaran: number;
  statusMutu: string;
  
  // TAMBAHAN: Parameter dengan Index Tertinggi
  paramDominan: string;      // Nama parameter (misal: "DO" atau "pH")
  nilaiIndexDominan: number; // Nilai index-nya (misal: 5.13)
}

// --- 2. KONFIGURASI BAKU MUTU ---
const BAKU_MUTU = {
  Amonia: 0.2,
  BOD: 3,
  COD: 25,
  DO: 4,        // Batas Minimum
  Nitrat: 10,
  PH_MIN: 6,
  PH_MAX: 9,
  TDS: 1000,
  TSS: 50
};

// --- 3. DATA SAMPEL ---
const rawData: Partial<StationRecord>[] = [
  { "id": 31803738, "time": "17/9/2025 10:16:31", "do_": "3.18", "tds": "9.78", "ph": "10.49", "bod": "0.00", "cod": "8.14", "tss": "0.00", "n": "0.01", "no3_3": "1.10", "id_stasiun": "TANJUNGPINANG-1" },
  { "id": 31803767, "time": "17/9/2025 10:26:31", "do_": "3.18", "tds": "9.78", "ph": "10.49", "bod": "0.00", "cod": "8.14", "tss": "0.00", "n": "0.01", "no3_3": "1.10", "id_stasiun": "TANJUNGPINANG-1" },
  { "id": 31803697, "time": "8/9/2025 11:20:03", "do_": "3.90", "tds": "9.26", "ph": "10.08", "bod": "0.00", "cod": "9.15", "tss": "0.00", "n": "0.03", "no3_3": "0.90", "id_stasiun": "TANJUNGPINANG-1" },
  { "id": 31803862, "time": "24/10/2025 10:33:42", "do_": "0.78", "tds": "11.98", "ph": "10.24", "bod": "5.56", "cod": "24.83", "tss": "0.00", "n": "0.04", "no3_3": "3.40", "id_stasiun": "TANJUNGPINANG-1" },
  { "id": 31803875, "time": "24/10/2025 10:34:42", "do_": "0.78", "tds": "11.97", "ph": "10.24", "bod": "5.55", "cod": "24.82", "tss": "0.00", "n": "0.03", "no3_3": "3.50", "id_stasiun": "TANJUNGPINANG-1" },
  { "id": 31803896, "time": "24/10/2025 10:36:42", "do_": "0.77", "tds": "11.85", "ph": "10.25", "bod": "5.60", "cod": "24.88", "tss": "0.00", "n": "0.03", "no3_3": "3.40", "id_stasiun": "TANJUNGPINANG-1" }
];

// --- 4. LOGIKA PERHITUNGAN ---

const parseVal = (val: string | null | undefined): number => {
  if (!val) return 0;
  return parseFloat(val) || 0;
};

function hitungRasio(val: number, std: number, type: 'polutan' | 'do' | 'ph'): number {
  if (type === 'polutan') {
    return val / std;
  } 
  else if (type === 'do') {
    if (val >= std) return 0.25;
    // Rumus DO: Std / Val (agar semakin kecil DO, rasio semakin besar)
    return std / (val + 0.001); 
  } 
  else if (type === 'ph') {
    if (val >= BAKU_MUTU.PH_MIN && val <= BAKU_MUTU.PH_MAX) return 0.2;
    let dist = 0;
    if (val < BAKU_MUTU.PH_MIN) dist = BAKU_MUTU.PH_MIN - val;
    if (val > BAKU_MUTU.PH_MAX) dist = val - BAKU_MUTU.PH_MAX;
    return dist;
  }
  return 0;
}

function processData(data: Partial<StationRecord>): HasilAnalisa {
  // 1. Ambil Nilai
  const val_amonia = parseVal(data.n);
  const val_bod    = parseVal(data.bod);
  const val_cod    = parseVal(data.cod);
  const val_do     = parseVal(data.do_);
  const val_nitrat = parseVal(data.no3_3);
  const val_ph     = parseVal(data.ph);
  const val_tds    = parseVal(data.tds);
  const val_tss    = parseVal(data.tss);

  // 2. Hitung Index Per Parameter
  // Simpan dalam objek agar mudah dicari max-nya
  const idx = {
    Amonia: parseFloat(hitungRasio(val_amonia, BAKU_MUTU.Amonia, 'polutan').toFixed(2)),
    BOD:    parseFloat(hitungRasio(val_bod, BAKU_MUTU.BOD, 'polutan').toFixed(2)),
    COD:    parseFloat(hitungRasio(val_cod, BAKU_MUTU.COD, 'polutan').toFixed(2)),
    DO:     parseFloat(hitungRasio(val_do, BAKU_MUTU.DO, 'do').toFixed(2)),
    Nitrat: parseFloat(hitungRasio(val_nitrat, BAKU_MUTU.Nitrat, 'polutan').toFixed(2)),
    PH:     parseFloat(hitungRasio(val_ph, 0, 'ph').toFixed(2)),
    TDS:    parseFloat(hitungRasio(val_tds, BAKU_MUTU.TDS, 'polutan').toFixed(2)),
    TSS:    parseFloat(hitungRasio(val_tss, BAKU_MUTU.TSS, 'polutan').toFixed(2)),
  };

  // 3. Mencari Parameter Dominan (Index Tertinggi)
  // Mengubah object menjadi array [key, value], lalu sort descending
  const sortedParams = Object.entries(idx).sort(([, a], [, b]) => b - a);
  const [dominantKey, dominantVal] = sortedParams[0];

  // 4. Hitung IP Keseluruhan (Nemerow)
  const values = Object.values(idx);
  const maxVal = Math.max(...values);
  const avgVal = values.reduce((a, b) => a + b, 0) / values.length;
  const IP = Math.sqrt((Math.pow(maxVal, 2) + Math.pow(avgVal, 2)) / 2);

  // 5. Status Mutu
  let status = "MEMENUHI BAKU MUTU";
  if (IP > 10.0) status = "CEMAR BERAT";
  else if (IP > 5.0) status = "CEMAR SEDANG";
  else if (IP > 1.0) status = "CEMAR RINGAN";

  return {
    id: data.id || 0,
    waktu: data.time || "",
    stasiun: data.id_stasiun || "",
    indexPerParam: idx,
    indeksPencemaran: parseFloat(IP.toFixed(2)),
    statusMutu: status,
    paramDominan: dominantKey,
    nilaiIndexDominan: dominantVal
  };
}

// --- 5. EKSEKUSI & PRINT HASIL ---

console.log("=== LAPORAN INDEKS & PARAMETER DOMINAN ===\n");

// Header Tabel
// Menambahkan kolom 'Dominan' dan 'Nilai Dom'
const headers = [
  "Waktu", "IP Total", "Status", "Dominan", "Nilai Dom",
  "Idx_Amo", "Idx_BOD", "Idx_COD", "Idx_DO", "Idx_Nit", "Idx_pH", "Idx_TDS", "Idx_TSS"
];

const rowStr = (cols: string[]) => {
  // Atur lebar kolom agar rapi
  const w = [12, 8, 18, 10, 10, 8, 8, 8, 8, 8, 8, 8, 8]; 
  return cols.map((c, i) => c.toString().padEnd(w[i])).join(" | ");
};

console.log(rowStr(headers));
console.log("-".repeat(170));

rawData.forEach(record => {
  const res = processData(record);
  const idx = res.indexPerParam;

  console.log(rowStr([
    res.waktu.split(' ')[0],        // Waktu
    res.indeksPencemaran.toString(),// IP Total
    res.statusMutu,                 // Status
    res.paramDominan,               // Param Tertinggi
    res.nilaiIndexDominan.toString(), // Nilai Index Tertinggi
    
    // Detail Index
    idx.Amonia.toString(),
    idx.BOD.toString(),
    idx.COD.toString(),
    idx.DO.toString(),
    idx.Nitrat.toString(),
    idx.PH.toString(),
    idx.TDS.toString(),
    idx.TSS.toString()
  ]));
});

console.log("\nCATATAN:");
console.log("- Kolom 'Dominan' menunjukkan parameter yang paling bertanggung jawab atas tingginya nilai IP.");
console.log("- Kolom 'Nilai Dom' adalah nilai index dari parameter dominan tersebut.");