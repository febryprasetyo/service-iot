import { readFileSync } from 'fs';
import { resolve } from 'path';
import { renderCalibrationReportHtml } from './CalibrationReportRenderer';

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
});
