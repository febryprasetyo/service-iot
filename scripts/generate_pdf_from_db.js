require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const QRCode = require('qrcode');
const puppeteer = require('puppeteer');
// helper import removed (not required here)

function formatStandardValue(value, parameterName, unit) {
  const numeric = Number(value);
  const formatted = parameterName === 'pH' && numeric === 4 ? '4.0' : String(numeric);
  if (parameterName === 'DO') return `${formatted}%`;
  return parameterName === 'pH' || !unit ? formatted : `${formatted} ${unit}`;
}

function formatCalibrationStatus(status) {
  if (status === 'PASS') return '<span class="tag-pass">PASS</span>';
  if (status === 'FAILED') return '<span class="tag-fail">FAILED</span>';
  return '<span class="tag-pending">PENDING</span>';
}

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error('Usage: node generate_pdf_from_db.js <calibration_id>');
    process.exit(2);
  }

  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });
  await client.connect();

  const calRes = await client.query('select * from calibrations where id = $1', [id]);
  if (!calRes.rows.length) {
    console.error('Calibration not found:', id);
    await client.end();
    process.exit(1);
  }
  const calibration = calRes.rows[0];

  const detailsRes = await client.query(`select cd.*, mp.name as parameter_name, mp.unit as parameter_unit from calibration_details cd join master_parameters mp on cd.parameter_id = mp.id where cd.calibration_id = $1`, [id]);
  const details = detailsRes.rows;

  const detailIds = details.map(d => d.id);
  let standards = [];
  if (detailIds.length) {
    const q = await client.query(`select * from calibration_detail_standards where calibration_detail_id = ANY($1::int[])`, [detailIds]);
    standards = q.rows;
  }

  const samplesRes = await client.query('select * from water_samples where calibration_id = $1', [id]);
  const waterSamples = samplesRes.rows;

  // load template & css
  const tmplPath = path.resolve(process.cwd(), 'src', 'views', 'Calibration_Report.html');
  const cssPath = path.resolve(process.cwd(), 'src', 'views', 'Calibration_Report.css');
  let html = fs.readFileSync(tmplPath, 'utf8');
  if (fs.existsSync(cssPath)) {
    const css = fs.readFileSync(cssPath, 'utf8');
    html = html.replace('<link rel="stylesheet" href="Calibration_Report.css">', `<style>${css}</style>`);
  }

  // generate qr
  // Prefer the frontend verification route. PUBLIC_CALIBRATION_BASE_URL keeps
  // compatibility with direct backend verification URLs.
  const frontendBaseUrl = process.env.PUBLIC_CALIBRATION_FRONTEND_URL;
  const apiBaseUrl = process.env.PUBLIC_CALIBRATION_BASE_URL;
  const publicUrl = frontendBaseUrl
    ? `${frontendBaseUrl.replace(/\/$/, '')}/verify/${calibration.verification_uuid}`
    : apiBaseUrl
      ? `${apiBaseUrl.replace(/\/$/, '')}/verify/${calibration.verification_uuid}`
      : `${process.env.PUBLIC_CALIBRATION_PROTOCOL || 'http'}://${process.env.HOST || 'localhost'}:${process.env.PORT || 3304}/verify/${calibration.verification_uuid}`;
  const qrImage = await QRCode.toDataURL(publicUrl, { errorCorrectionLevel: 'H', width: 93 });

  // build cal rows
  let calRows = '';
  for (const d of details) {
    const stored = standards.filter(s => s.calibration_detail_id === d.id);
    // master standards could be retrieved but we'll use stored or fallback
    const paramStandards = stored.length ? stored : [];

    const unit = d.parameter_unit || (d.parameter_name === 'pH' ? 'Unit' : '');
    const standardsColumn = paramStandards.length ? paramStandards.map(s => {
      const name = s.crm_name || '';
      const val = formatStandardValue(s.crm_standard_value, d.parameter_name, d.parameter_unit);
      if (/crm/i.test(name)) return `CRM ${val}`;
      return name || val;
    }).join('<br>') : '-';

    const readingLines = [];
    for (const s of paramStandards) {
      if (!/crm/i.test(s.crm_name || '')) {
        readingLines.push(s.calibration_result != null ? Number(s.calibration_result).toFixed(4) : '-');
      }
    }
    const crmStd = paramStandards.find(s => /crm/i.test(s.crm_name || ''));
    if (d.crm_reading_value != null) {
      readingLines.push(`${d.crm_reading_value} ${unit}`.trim());
    } else if (crmStd && crmStd.calibration_result != null) {
      readingLines.push(Number(crmStd.calibration_result).toFixed(4));
    }
    const readingsColumn = readingLines.join('<br>') || '-';

    let coeffText = '-';
    if (d.coefficients) {
      const coeffs = typeof d.coefficients === 'string' ? JSON.parse(d.coefficients) : d.coefficients;
      if (d.parameter_name === 'pH') {
        const keys = ['k1','k2','k3','k4','k5','k6'];
        coeffText = keys.map(k => coeffs[k] !== undefined ? `<strong>${k.toUpperCase()}:</strong> ${coeffs[k]}` : null).filter(Boolean).join('<br>') || '-';
      } else {
        coeffText = Object.entries(coeffs || {}).map(([k,v]) => `<strong>${k.toUpperCase()}:</strong> ${v}`).join('<br>') || '-';
      }
    }

    const calculationStatus = d.calculation_result || null;
    const resultColumn = formatCalibrationStatus(calculationStatus);

    calRows += `\n<tr>\n<td class="font-bold">${d.parameter_name} Calibration</td>\n<td class="text-center">${standardsColumn}</td>\n<td class="text-center">${readingsColumn}</td>\n<td class="text-center">${coeffText}</td>\n<td class="text-center">${resultColumn}</td>\n</tr>`;
  }

  let sampleRows = '';
  for (const ws of waterSamples) {
    sampleRows += `\n<tr>\n<td class="font-bold" style="text-align: left;">${ws.sample_name}</td>\n<td>${ws.suhu != null ? ws.suhu : '-'}</td>\n<td>${ws.do != null ? ws.do : '-'}</td>\n<td>${ws.tds != null ? ws.tds : '-'}</td>\n<td>${ws.tur != null ? ws.tur : '-'}</td>\n<td>${ws.ph != null ? ws.ph : '-'}</td>\n<td>${ws.orp != null ? ws.orp : '-'}</td>\n<td>${ws.cod != null ? ws.cod : '-'}</td>\n<td>${ws.bod != null ? ws.bod : '-'}</td>\n<td>${ws.tss != null ? ws.tss : '-'}</td>\n<td>${ws.amonia != null ? ws.amonia : '-'}</td>\n<td>${ws.nitrat != null ? ws.nitrat : '-'}</td>\n<td>${ws.nitrit != null ? ws.nitrit : '-'}</td>\n<td>${ws.kedalaman != null ? ws.kedalaman : '-'}</td>\n</tr>`;
  }

  const formatDate = (date) => new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const formattedDate = calibration.calibration_start_date && calibration.calibration_end_date
    ? (calibration.calibration_start_date === calibration.calibration_end_date
      ? formatDate(calibration.calibration_start_date)
      : `${formatDate(calibration.calibration_start_date)} – ${formatDate(calibration.calibration_end_date)}`)
    : '-';
  const placeDate = new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});

  html = html.replace('{{REPORT_NO}}', calibration.report_no || '-')
    .replace('{{STATION_NAME}}', calibration.station_name || '-')
    .replace('{{CALIBRATION_DATE}}', formattedDate)
    .replace('{{STATION_ADDRESS}}', calibration.station_address || '-')
    .replace('{{STATION_COORDINATE}}', calibration.station_coordinate || '-')
    .replace('{{CALIBRATION_ROWS}}', calRows)
    .replace('{{SAMPLE_ROWS}}', sampleRows)
    .replace('{{NOTES}}', calibration.notes || '<ul><li>Tidak ada catatan.</li></ul>')
    .replace('{{QR_CODE_IMAGE}}', qrImage)
    .replace('{{OFFICER_NAME}}', calibration.officer_name || '-')
    .replace(/{{PLACE_DATE}}/g, placeDate);

  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const out = path.join(process.cwd(), 'tmp', `calibration_${id}.pdf`);
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '12mm', right: '15mm', bottom: '12mm', left: '15mm' } });
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, pdfBuffer);
    console.log('Wrote', out);
  } finally {
    await browser.close();
    await client.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
