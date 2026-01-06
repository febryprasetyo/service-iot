interface IkaInput {
  amonia: number;
  bod: number;
  cod: number;
  do_: number;
  nitrat: number;
  ph: number;
  tds: number;
  tss: number;
}

interface IkaResult {
  indeksPencemaran: number;
  statusMutu: string;
  paramDominan: string;
  nilaiIndexDominan: number;
  indexPerParam: any;
}

// ============================================================================
// KONFIGURASI BAKU MUTU (PermenLHK 27/2021 - KELAS 2 - Air Sungai/Tawar)
// ============================================================================
const BAKU_MUTU = {
  TDS: 1000,      // mg/L
  TSS: 50,        // mg/L
  PH_MIN: 6,      // Unit pH
  PH_MAX: 9,      // Unit pH
  PH_AVG: 7.5,    // Rata-rata pH
  BOD: 3,         // mg/L
  COD: 25,        // mg/L
  DO_MIN: 4,      // mg/L (Batas Minimum)
  DO_SAT: 8.1,    // mg/L (Nilai Jenuh Oksigen pd ~25°C - Sesuai Rumus Baru)
  NO3: 10,        // Nitrat (mg/L)
  AMONIA: 0.2     // Amonia Total (mg/L)
};

function getRatio(val: number, std: number, type: 'polutan' | 'do' | 'ph'): number {
  let ratio = 0;

  // --- A. TIPE POLUTAN (Semakin tinggi = Semakin Buruk) ---
  if (type === 'polutan') {
    ratio = val / std;
  } 
  
  // --- B. TIPE DO (Semakin rendah = Semakin Buruk) ---
  else if (type === 'do') {
    // Jika nilai DO >= Standar, dianggap bagus (ratio kecil/aman)
    if (val >= std) return 0.25; 
    
    // Rumus Defisit Oksigen: (Csat - Ci) / (Csat - Li)
    const numerator = Math.abs(BAKU_MUTU.DO_SAT - val);
    const denominator = Math.abs(BAKU_MUTU.DO_SAT - std);
    ratio = numerator / (denominator + 0.0001); // Avoid div by zero
  } 
  
  // --- C. TIPE PH (Penyimpangan dari Rata-rata) ---
  else if (type === 'ph') {
    if (val >= BAKU_MUTU.PH_MIN && val <= BAKU_MUTU.PH_MAX) return 0.2; // Aman
    
    if (val < BAKU_MUTU.PH_AVG) {
        // Jika Asam
        ratio = (BAKU_MUTU.PH_AVG - val) / (BAKU_MUTU.PH_AVG - BAKU_MUTU.PH_MIN);
    } else {
        // Jika Basa
        ratio = (val - BAKU_MUTU.PH_AVG) / (BAKU_MUTU.PH_MAX - BAKU_MUTU.PH_AVG);
    }
  }

  // --- D. HANDLING NEW LOGARITMIK (PermenLHK 27/2021) ---
  // Jika Ratio > 1.0 (Melampaui Baku Mutu), gunakan rumus Logaritma
  // Rumus: 1.0 + 5.0 * log10(Rasio)
  if (ratio > 1.0) {
      return 1.0 + (5.0 * Math.log10(ratio));
  }

  return ratio;
}

export function calculateIKA(data: IkaInput): IkaResult {
  // Hanya menghitung 8 parameter sesuai Instruksi
  
  const idx = {
    TDS:    parseFloat(getRatio(data.tds, BAKU_MUTU.TDS, 'polutan').toFixed(4)), // TDS maps to ct in aggregation but passed as tds here
    TSS:    parseFloat(getRatio(data.tss, BAKU_MUTU.TSS, 'polutan').toFixed(4)),
    pH:     parseFloat(getRatio(data.ph, 0, 'ph').toFixed(4)), // 0 placeholder for std
    BOD:    parseFloat(getRatio(data.bod, BAKU_MUTU.BOD, 'polutan').toFixed(4)),
    COD:    parseFloat(getRatio(data.cod, BAKU_MUTU.COD, 'polutan').toFixed(4)),
    DO:     parseFloat(getRatio(data.do_, BAKU_MUTU.DO_MIN, 'do').toFixed(4)),
    Amonia: parseFloat(getRatio(data.amonia, BAKU_MUTU.AMONIA, 'polutan').toFixed(4)),
    Nitrat: parseFloat(getRatio(data.nitrat, BAKU_MUTU.NO3, 'polutan').toFixed(4)),
  };

  // Mencari Parameter Dominan
  const sortedParams = Object.entries(idx).sort(([, a], [, b]) => b - a);
  const [dominantKey, dominantVal] = sortedParams[0];

  // Hitung IP Keseluruhan (Nemerow)
  const values = Object.values(idx);
  const maxVal = Math.max(...values);
  const avgVal = values.reduce((a, b) => a + b, 0) / values.length;
  // Rumus Nemerow Sumitomo
  const IP = Math.sqrt((Math.pow(maxVal, 2) + Math.pow(avgVal, 2)) / 2);

  // Status Mutu
  let status = "MEMENUHI BAKU MUTU";
  if (IP >= 10.0) status = "CEMAR BERAT"; 
  else if (IP > 5.0) status = "CEMAR SEDANG";
  else if (IP > 1.0) status = "CEMAR RINGAN";

  return {
    indeksPencemaran: parseFloat(IP.toFixed(2)),
    statusMutu: status,
    paramDominan: dominantKey,
    nilaiIndexDominan: dominantVal as number,
    indexPerParam: idx
  };
}

// Rational Bounds for River/Lake Water
const RATIONAL_BOUNDS = {
    ph: { min: 1, max: 14 }, // pH cannot be < 0 or > 14 physically, but natural 2-12
    temp: { min: 0, max: 45 }, // Water usually 20-35 C
    do: { min: 0, max: 20 }, // Saturation ~8-9, supersaturation maybe 15? >20 implies sensor error
    cod: { min: 0, max: 5000 },
    bod: { min: 0, max: 2000 },
    tss: { min: 0, max: 5000 },
    tds: { min: 0, max: 10000 }, // Fresh -> Brackish -> Saline
    nitrat: { min: 0, max: 500 },
    amonia: { min: 0, max: 100 }
};

export function checkRationality(data: any): { isValid: boolean, message: string } {
    let isValid = true;
    let messages: string[] = [];

    const check = (key: string, val: any, label: string) => {
        const num = parseFloat(val);
        // Ignore if null/undefined or if status is Broken/Offline (-3) or Maint (-1/-2)
        // Also ignore 0 values if they are placeholders? No, 0 is a valid reading (except pH).
        if (isNaN(num) || num < 0) return; 

        const bounds = (RATIONAL_BOUNDS as any)[key];
        if (bounds) {
            if (num < bounds.min || num > bounds.max) {
                isValid = false;
                messages.push(`${label} ${num} diluar batas wajar (${bounds.min}-${bounds.max})`);
            }
        }
    };

    check('ph', data.ph, 'pH');
    check('temp', data.temperature || data.temp, 'Suhu'); // flexible key
    check('do', data.do_ || data.do, 'DO');
    check('cod', data.cod, 'COD');
    check('bod', data.bod, 'BOD');
    check('tss', data.tss, 'TSS');
    check('tds', data.ct || data.tds, 'TDS/CT');
    check('nitrat', data.no3_3 || data.no3 || data.nitrat, 'Nitrat');
    check('amonia', data.n || data.amonia, 'Amonia');

    return {
        isValid,
        message: isValid ? "Data Valid" : messages.join(", ")
    };
}
