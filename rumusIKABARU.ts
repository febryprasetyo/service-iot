// ============================================================================
// 1. KONFIGURASI BAKU MUTU (PP 22/2021 - KELAS 2 - Air Sungai/Tawar)
// ============================================================================
// Parameter yang tidak ada di sini tidak akan dihitung.
const BAKU_MUTU = {
    TDS: 1000,      // mg/L
    TSS: 50,        // mg/L
    PH_MIN: 6,      // Unit pH
    PH_MAX: 9,      // Unit pH
    PH_AVG: 7.5,    // Rata-rata pH
    BOD: 3,         // mg/L
    COD: 25,        // mg/L
    DO_MIN: 4,      // mg/L (Batas Minimum)
    DO_SAT: 8.1,    // mg/L (Nilai Jenuh Oksigen pd ~25°C)
    NO3: 10,        // Nitrat (mg/L)
    AMONIA: 0.2     // Amonia Total (mg/L)
};

// Interface Data JSON dari Alat Anda
interface SensorData {
    temperature: string;
    DO: string;
    TUR: string;
    TDS: string;
    PH: string;
    ORP: string;
    BOD: string;
    COD: string;
    TSS: string;
    Amonia: string;
    NO3: string; 
    NO32: string;
    Depth: string;
}

// ============================================================================
// 2. FUNGSI LOGIKA RASIO (Sesuai PermenLHK 27/2021)
// ============================================================================
function getRatio(val: number, std: number, type: 'polutan' | 'do' | 'ph'): number {
    let ratio = 0;

    // --- A. TIPE POLUTAN (Semakin tinggi = Semakin Buruk) ---
    // Digunakan untuk: TDS, TSS, BOD, COD, Amonia, Nitrat
    if (type === 'polutan') {
        ratio = val / std;
    } 
    
    // --- B. TIPE DO (Semakin rendah = Semakin Buruk) ---
    else if (type === 'do') {
        // Jika nilai DO >= Standar, dianggap bagus (ratio kecil/aman)
        if (val >= std) return 0.25; // Angka konstan aman
        
        // Rumus Defisit Oksigen: (Csat - Ci) / (Csat - Li)
        const numerator = Math.abs(BAKU_MUTU.DO_SAT - val);
        const denominator = Math.abs(BAKU_MUTU.DO_SAT - std);
        ratio = numerator / denominator;
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

    // --- D. HANDLING NEW LOGARITMIK (Sangat Penting) ---
    // Jika Ratio > 1.0 (Melampaui Baku Mutu), gunakan rumus Logaritma
    // Rumus: 1.0 + 5.0 * log10(Rasio)
    if (ratio > 1.0) {
        return 1.0 + (5.0 * Math.log10(ratio));
    }

    return ratio;
}

// ============================================================================
// 3. FUNGSI UTAMA HITUNG IKA (INDEKS PENCEMARAN)
// ============================================================================
export function hitungIKA(data: SensorData) {
    // Array untuk menampung hasil perhitungan per parameter yang DIUJI saja
    const results = [];

    // 1. TDS
    const valTDS = parseFloat(data.TDS);
    results.push({ 
        param: 'TDS', 
        val: valTDS, 
        ratio: getRatio(valTDS, BAKU_MUTU.TDS, 'polutan') 
    });

    // 2. TSS
    const valTSS = parseFloat(data.TSS);
    results.push({ 
        param: 'TSS', 
        val: valTSS, 
        ratio: getRatio(valTSS, BAKU_MUTU.TSS, 'polutan') 
    });

    // 3. pH
    const valPH = parseFloat(data.PH);
    results.push({ 
        param: 'pH', 
        val: valPH, 
        ratio: getRatio(valPH, 0, 'ph') 
    });

    // 4. BOD
    const valBOD = parseFloat(data.BOD);
    results.push({ 
        param: 'BOD', 
        val: valBOD, 
        ratio: getRatio(valBOD, BAKU_MUTU.BOD, 'polutan') 
    });

    // 5. COD
    const valCOD = parseFloat(data.COD);
    results.push({ 
        param: 'COD', 
        val: valCOD, 
        ratio: getRatio(valCOD, BAKU_MUTU.COD, 'polutan') 
    });

    // 6. DO (Dissolved Oxygen)
    const valDO = parseFloat(data.DO);
    results.push({ 
        param: 'DO', 
        val: valDO, 
        ratio: getRatio(valDO, BAKU_MUTU.DO_MIN, 'do') 
    });

    // 7. Amonia
    const valAmonia = parseFloat(data.Amonia);
    results.push({ 
        param: 'Amonia', 
        val: valAmonia, 
        ratio: getRatio(valAmonia, BAKU_MUTU.AMONIA, 'polutan') 
    });

    // 8. Nitrat (NO3)
    const valNO3 = parseFloat(data.NO3);
    results.push({ 
        param: 'Nitrat', 
        val: valNO3, 
        ratio: getRatio(valNO3, BAKU_MUTU.NO3, 'polutan') 
    });

    // NOTE: NO2 (Nitrit), ORP, Turbidity, Depth SENGAJA DIABAIKAN (Tidak dipush ke array)

    // --- HITUNG SKOR AKHIR (NEMEROW SUMITOMO) ---
    const allRatios = results.map(r => r.ratio);
    
    // Cari Ratio Maksimum (Ci/Lij Max)
    const maxRatio = Math.max(...allRatios);
    
    // Cari Ratio Rata-rata (Ci/Lij Avg)
    const sumRatio = allRatios.reduce((a, b) => a + b, 0);
    const avgRatio = sumRatio / allRatios.length;

    // Rumus Akar PI
    const PI = Math.sqrt( (Math.pow(maxRatio, 2) + Math.pow(avgRatio, 2)) / 2 );

    // Tentukan Status
    let status = "";
    if (PI <= 1.0) status = "Baik (Memenuhi Baku Mutu)";
    else if (PI <= 5.0) status = "Cemar Ringan";
    else if (PI <= 10.0) status = "Cemar Sedang";
    else status = "Cemar Berat";

    return {
        skor_indeks: parseFloat(PI.toFixed(2)),
        status_mutu: status,
        detail_parameter: results
    };
}

// ============================================================================
// 4. TEST DATA
// ============================================================================
const dataSaya = {
    "temperature": "26.20",
    "DO": "6.00",
    "TUR": "0.00",
    "TDS": "162.22",
    "PH": "6.88",
    "ORP": "188.45",   // Diabaikan
    "BOD": "0.00",
    "COD": "3.33",
    "TSS": "0.00",
    "Amonia": "0.13",
    "NO3": "3.50",
    "NO32": "10.10",   // Diabaikan sesuai request
    "Depth": "0.27"    // Diabaikan
};

console.log(JSON.stringify(hitungIKA(dataSaya), null, 2));