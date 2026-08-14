import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  buildCalibrationPdfFilename,
  formatReportNumberValue,
  getCalibrationPdfResponseContract,
  renderCalibrationReportHtml
} from './CalibrationReportRenderer';

describe('renderCalibrationReportHtml', () => {
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
        }
      ],
      waterSamples: [{ sample_name: 'Air Sungai', suhu: 25, do: 5.4, ph: 7 }]
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
    expect(getCalibrationPdfResponseContract('CR/2026 VIII', 'cal-7')).toEqual({
      contentType: 'application/pdf',
      contentDisposition: 'attachment; filename="Laporan_Kalibrasi_CR_2026_VIII.pdf"',
      notFoundMessage: 'Laporan kalibrasi tidak ditemukan.',
      templateNotFoundMessage: 'Template laporan kalibrasi tidak ditemukan.',
      renderErrorMessage: 'Gagal membuat PDF laporan kalibrasi.'
    });
  });
});
