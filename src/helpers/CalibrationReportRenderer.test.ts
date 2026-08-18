import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  buildCalibrationPdfFilename,
  formatCalibrationDateRange,
  formatCalibrationParameterName,
  formatCalibrationStandard,
  formatIndonesianDate,
  formatReportPlace,
  formatReportNumberValue,
  getCalibrationPdfResponseContract,
  getCalibrationHtmlResponseContract,
  renderCalibrationReportHtml,
  sanitizeCalibrationNotes
} from './CalibrationReportRenderer';

describe('renderCalibrationReportHtml', () => {
  it('matches the frontend golden date contract for local dates and calendar validation', () => {
    const originalTimezone = process.env.TZ;
    process.env.TZ = 'Asia/Jakarta';

    try {
      const localMidnight = new Date(2026, 7, 12, 0, 0, 0);

      expect(localMidnight.toISOString()).toBe('2026-08-11T17:00:00.000Z');
      expect(formatIndonesianDate(localMidnight)).toBe('12 Agustus 2026');
      expect(formatCalibrationDateRange('2026-08-10', '2026-09-02')).toBe('10 Agustus–2 September 2026');
      expect(formatCalibrationDateRange('2026-12-31', '2027-01-02')).toBe('31 Desember 2026–2 Januari 2027');
      expect(formatIndonesianDate('2026-02-31')).toBe('2026-02-31');
      expect(formatCalibrationDateRange('2026-02-31', '2026-08-12')).toBe('2026-02-31–12 Agustus 2026');
    } finally {
      if (originalTimezone === undefined) delete process.env.TZ;
      else process.env.TZ = originalTimezone;
    }
  });

  it('matches the frontend golden standard, place, parameter, and coefficient contract', () => {
    expect(formatCalibrationStandard('0', 0, 'DO', 'mg/L')).toBe('0,00 mg/L');
    expect(formatCalibrationStandard('CRM 5.51', null, 'DO', 'mg/L')).toBe('CRM 5.51 mg/L');
    expect(formatCalibrationStandard('CRM pH 7', null, 'pH', 'Satuan')).toBe('CRM pH 7');
    expect(formatReportPlace('  kota   morowali UTARA  ')).toBe('Morowali Utara');
    expect(formatReportPlace('Bukit Kota Indah')).toBe('Bukit Kota Indah');
    expect(formatCalibrationParameterName('Amonia')).toBe('Amonia (NH3-N)');
    expect(formatCalibrationParameterName('NO3-N')).toBe('Nitrat (NO3-N)');
    expect(formatCalibrationParameterName('no2')).toBe('Nitrit (NO2-N)');
    expect(formatReportNumberValue(1.005)).toBe('1,01');
    expect(formatReportNumberValue(1.413)).toBe('1,41');
  });

  it('uses frontend-equivalent rounding for standards, readings, coefficients, and sample measurements', () => {
    const template = readFileSync(resolve(process.cwd(), 'src/views/Calibration_Report.html'), 'utf8');
    const html = renderCalibrationReportHtml(template, {
      reportNo: 'CR-ROUNDING',
      stationName: 'KLHK299',
      calibrationStartDate: '2026-08-12',
      calibrationEndDate: '2026-08-12',
      stationCity: '  kota   morowali UTARA  ',
      qrCodeImage: 'data:image/png;base64,fixture',
      details: [{
        parameterName: 'DO',
        parameterUnit: 'mg/L',
        standards: [{ crmName: '1.005', crmStandardValue: 1.005, calibrationResult: 1.005 }],
        coefficients: { k: 1.005, b: 1.005 },
        calculationStatus: 'PASS'
      }],
      waterSamples: [{ sample_name: 'Sampel Air', suhu: 1.005, do: 1.005 }]
    });

    expect(html).toContain('<td class="text-center">1,01 mg/L</td>');
    expect(html).toContain('<td class="text-center">1,01</td>');
    expect(html).toContain('<strong>K:</strong> 1,01');
    expect(html).toContain('<strong>B:</strong> 1,01');
    expect(html).toContain('<td>1,01</td><td>1,01</td>');
    expect(html).toContain('<strong>Tempat/Tanggal:</strong> Morowali Utara, 12 Agustus 2026');
  });

  it('renders the Indonesian PDF acceptance fixture with localized dates, values, labels, and statuses', () => {
    const template = readFileSync(resolve(process.cwd(), 'src/views/Calibration_Report.html'), 'utf8');

    const html = renderCalibrationReportHtml(template, {
      reportNo: 'CR-2026/VIII/OMS-CMC/003',
      stationName: 'KLHK299',
      calibrationStartDate: '2026-08-10',
      calibrationEndDate: '2026-08-12',
      stationAddress: 'Desa Bunta, Morowali Utara',
      stationCoordinate: 'LAT -1.234 | LONG 121.456',
      stationCity: 'Kabupaten Morowali Utara',
      officerName: 'febry',
      notes: null,
      qrCodeImage: 'data:image/png;base64,fixture',
      details: [
        {
          parameterName: 'DO',
          parameterUnit: 'mg/L',
          standards: [
            { crmName: '0', crmStandardValue: 0, calibrationResult: 0 },
            { crmName: '100', crmStandardValue: 100, calibrationResult: 99.84 }
          ],
          crmReferenceValue: 5.51,
          crmReadingValue: 5.4,
          coefficients: { k: 1.41, b: 0 },
          calculationStatus: 'PASS'
        },
        {
          parameterName: 'pH',
          parameterUnit: 'Unit',
          standards: [{ crmName: '7', crmStandardValue: 7, calibrationResult: 7 }],
          crmReadingValue: 7,
          coefficients: { k1: 1, k2: 2 },
          calculationStatus: 'FAILED'
        },
        {
          parameterName: 'TSS',
          parameterUnit: 'mg/L',
          standards: [],
          calculationStatus: null
        },
        {
          parameterName: 'Amonia',
          parameterUnit: 'mg/L',
          standards: [],
          calculationStatus: null
        },
        {
          parameterName: 'Nitrat',
          parameterUnit: 'mg/L',
          standards: [],
          calculationStatus: null
        },
        {
          parameterName: 'Nitrit',
          parameterUnit: 'mg/L',
          standards: [],
          calculationStatus: null
        }
      ],
      waterSamples: [{ sample_name: 'Air Sungai', suhu: 25, do: 5.4, ph: 7, amonia: 1, nitrat: 10, nitrit: 100 }]
    });

    expect(html).toContain('LAPORAN KALIBRASI');
    expect(html).toContain('Nomor Laporan: KLHK299/CR-2026/VIII/OMS-CMC/003');
    expect(html).toContain('Nama Stasiun');
    expect(html).toContain('Tanggal Kalibrasi');
    expect(html).toContain('Alamat');
    expect(html).toContain('Koordinat');
    expect(html).toContain('Standar/CRM');
    expect(html).toContain('Koefisien Internal (K/B)');
    expect(html).toContain('Kalibrasi DO');
    expect(html).toContain('Pengukuran Sampel Air dan Uji Blangko');
    expect(html).toContain('Jenis Sampel');
    expect(html).toContain('<span class="header-label">pH</span><span class="header-unit">Satuan</span>');
    expect(html).toContain('Catatan');
    expect(html).toContain('Tempat/Tanggal:</strong> Morowali Utara, 12 Agustus 2026');
    expect(html).toContain('Petugas Kalibrasi');
    expect(html).toContain('10–12 Agustus 2026');
    expect(html).toContain('0,00 mg/L');
    expect(html).toContain('CRM 5,51 mg/L');
    expect(html).toContain('5,40');
    expect(html).toContain('1,41');
    expect(html).toContain('0,00');
    expect(html).toContain('<span class="tag-pass">Lulus</span>');
    expect(html).toContain('<span class="tag-fail">Tidak Lulus</span>');
    expect(html).toContain('<span class="tag-pending">Menunggu</span>');
    expect(html).toContain('>7,00</td>');
    expect(html).not.toContain('>7,00 Unit</td>');
    expect(html).toContain('Kalibrasi Amonia (NH3-N)');
    expect(html).toContain('Kalibrasi Nitrat (NO3-N)');
    expect(html).toContain('Kalibrasi Nitrit (NO2-N)');
    expect(html).toContain('<span class="header-label">Amonia (NH3-N)</span><span class="header-unit">(mg/L)</span>');
    expect(html).toContain('<span class="header-label">Nitrat (NO3-N)</span><span class="header-unit">(mg/L)</span>');
    expect(html).toContain('<span class="header-label">Nitrit (NO2-N)</span><span class="header-unit">(mg/L)</span>');
    expect(html).toContain('<img src="data:image/png;base64,fixture" alt="Kode QR verifikasi"');
  });

  it('uses a sanitized standard name when the standard value is null', () => {
    const template = readFileSync(resolve(process.cwd(), 'src/views/Calibration_Report.html'), 'utf8');
    const html = renderCalibrationReportHtml(template, {
      reportNo: 'CR-STANDARD-FALLBACK',
      stationName: 'KLHK299',
      calibrationStartDate: '2026-08-10',
      calibrationEndDate: '2026-09-02',
      stationCity: '  kota morowali UTARA  ',
      qrCodeImage: 'data:image/png;base64,fixture',
      details: [{
        parameterName: 'DO',
        parameterUnit: 'mg/L',
        standards: [{ crmName: 'CRM <img src=x onerror=alert(1)>5.51', crmStandardValue: null }],
        coefficients: { k: 1.413, b: 0 },
        calculationStatus: null
      }],
      waterSamples: []
    });

    expect(html).toContain('<td class="st-val">: 10 Agustus–2 September 2026</td>');
    expect(html).toContain('<strong>Tempat/Tanggal:</strong> Morowali Utara, 2 September 2026');
    expect(html).toContain('CRM &lt;img src=x onerror=alert(1)&gt;5.51 mg/L');
    expect(html).toContain('<strong>K:</strong> 1,41');
    expect(html).toContain('<strong>B:</strong> 0,00');
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
  });

  it('escapes ordinary report text and sanitizes rich-text notes', () => {
    const template = readFileSync(resolve(process.cwd(), 'src/views/Calibration_Report.html'), 'utf8');

    const html = renderCalibrationReportHtml(template, {
      reportNo: '<img src=x onerror=alert(1)>',
      stationName: '<script>alert(2)</script>',
      calibrationStartDate: '2026-08-10',
      calibrationEndDate: '2026-08-10',
      stationAddress: '<b onclick="alert(3)">Alamat</b>',
      stationCoordinate: '" onmouseover="alert(4)',
      stationCity: 'Kota Aman',
      officerName: '<svg onload=alert(5)>',
      notes: '<p onclick="alert(6)" style="color:red">Catatan <strong>aman</strong><em>miring</em><i>italik</i><u>garis bawah</u><s>coret</s><strike>hapus</strike><br>akhir<script>alert(7)</script><img src=x onerror=alert(8)><a href="https://evil.test">tautan</a></p><ul style="list-style:none"><li>butir</li></ul><ol><li>urut</li></ol>',
      qrCodeImage: 'data:image/png;base64,fixture',
      details: [{
        parameterName: '<img src=x onerror=alert(9)>',
        parameterUnit: 'mg/L',
        standards: [{ crmName: '<b onclick=alert(10)>CRM</b>', crmStandardValue: 5.51, calibrationResult: 5.4 }],
        calculationStatus: 'PASS'
      }],
      waterSamples: [{ sample_name: '<img src=x onerror=alert(11)>', suhu: 25 }]
    });

    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&lt;script&gt;alert(2)&lt;/script&gt;');
    expect(html).toContain('&lt;img src=x onerror=alert(11)&gt;');
    expect(html).toContain('<p>Catatan <strong>aman</strong><em>miring</em><i>italik</i><u>garis bawah</u><s>coret</s><strike>hapus</strike><br />akhirtautan</p>');
    expect(html).toContain('<ul><li>butir</li></ul>');
    expect(html).toContain('<ol><li>urut</li></ol>');
    expect(html).not.toContain('alert(7)');
    expect(html).not.toMatch(/<[^>]+\son\w+\s*=/i);
    expect(html).not.toMatch(/<script\b/i);
    expect(html).not.toMatch(/<a\b/i);
    expect(html).not.toContain('https://evil.test');
    const noteMarkup = html.match(/<div class="notes-box">[\s\S]*?<\/div>/)?.[0] || '';
    expect(noteMarkup).not.toMatch(/\sstyle=/i);
  });

  it('exports the renderer allowlist sanitizer for calibration write boundaries', () => {
    const hostileNotes = '<p onclick="alert(1)">Catatan <strong data-secret="x">aman</strong><em>miring</em><a href="https://evil.test">tautan</a><script>alert(2)</script></p><ul style="color:red"><li>butir</li></ul>';

    expect(sanitizeCalibrationNotes(hostileNotes)).toBe(
      '<p>Catatan <strong>aman</strong><em>miring</em>tautan</p><ul><li>butir</li></ul>'
    );
    expect(sanitizeCalibrationNotes(null)).toBeNull();
    expect(sanitizeCalibrationNotes(undefined)).toBeUndefined();
  });

  it('renders null, undefined, and empty numeric values as placeholders', () => {
    expect(formatReportNumberValue(null)).toBe('-');
    expect(formatReportNumberValue(undefined)).toBe('-');
    expect(formatReportNumberValue('')).toBe('-');

    const template = readFileSync(resolve(process.cwd(), 'src/views/Calibration_Report.html'), 'utf8');
    const html = renderCalibrationReportHtml(template, {
      reportNo: 'CR-EMPTY',
      stationName: 'KLHK299',
      calibrationStartDate: '2026-08-10',
      calibrationEndDate: '2026-08-10',
      qrCodeImage: 'data:image/png;base64,fixture',
      details: [{
        parameterName: 'DO',
        parameterUnit: 'mg/L',
        standards: [{ crmName: '0', crmStandardValue: null, calibrationResult: undefined }],
        calculationStatus: null
      }],
      waterSamples: [{ sample_name: 'Air Sungai', suhu: null, do: '' }]
    });

    expect(html).toContain('<td class="text-center">-</td>');
    expect(html).toContain('<td>-</td><td>-</td>');
    expect(html).not.toContain('0,00');
    expect(html).not.toContain('- mg/L');
  });

  it('defines the visible PDF filename, headers, and errors without changing the PDF response type', () => {
    expect(buildCalibrationPdfFilename('CR/2026 VIII', 'cal-7')).toBe('Laporan_Kalibrasi_CR_2026_VIII.pdf');
    expect(buildCalibrationPdfFilename(null, 'cal-7')).toBe('Laporan_Kalibrasi_kalibrasi_cal-7.pdf');
    expect(getCalibrationPdfResponseContract('CR/2026 VIII', 'cal-7')).toEqual({
      contentType: 'application/pdf',
      contentDisposition: 'attachment; filename="Laporan_Kalibrasi_CR_2026_VIII.pdf"',
      notFoundMessage: 'Laporan kalibrasi tidak ditemukan.',
      templateNotFoundMessage: 'Template laporan kalibrasi tidak ditemukan.',
      renderErrorMessage: 'Gagal membuat PDF laporan kalibrasi.'
    });
  });

  it('defines an inline HTML response for the shared report preview', () => {
    expect(getCalibrationHtmlResponseContract()).toEqual({
      contentType: 'text/html; charset=utf-8',
      contentDisposition: 'inline'
    });
  });
});
