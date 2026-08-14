const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function renderTemplate(templatePath, cssPath, replacements, outPath) {
  let html = fs.readFileSync(templatePath, 'utf8');
  if (cssPath && fs.existsSync(cssPath)) {
    const css = fs.readFileSync(cssPath, 'utf8');
    html = html.replace('<link rel="stylesheet" href="Calibration_Report.css">', `<style>${css}</style>`);
  }

  for (const k of Object.keys(replacements)) {
    const v = replacements[k];
    html = html.split(k).join(v);
  }

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '12mm', right: '15mm', bottom: '12mm', left: '15mm' } });
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, pdfBuffer);
    console.log('Wrote', outPath);
  } finally {
    await browser.close();
  }
}

function buildCalRows() {
  // Build rows similar to parsed sample
  const rows = [];
  rows.push(`<tr><td class="font-bold">DO Calibration</td><td>-</td><td>Solution 1<br>Solution 2<br>CRM Reference: 5.5100</td><td class="text-center">0.0000<br>99.8400<br>3.14 mg/L<br><strong>Status:</strong> <span class="tag-pass">PASS</span></td><td><strong>K:</strong> 0.99911<br><strong>B:</strong> -0.000024</td></tr>`);
  rows.push(`<tr><td class="font-bold">Turbidity Calibration</td><td>-</td><td>Solution 1<br>Solution 2<br>CRM Reference: 4.6700</td><td class="text-center">3.7000<br>19.6300<br>4.64 NTU<br><strong>Status:</strong> <span class="tag-pass">PASS</span></td><td><strong>K:</strong> 0.265294<br><strong>B:</strong> -5.97067</td></tr>`);
  rows.push(`<tr><td class="font-bold">TDS Calibration</td><td>-</td><td>Solution 1<br>Solution 2<br>CRM Reference: 200.0000</td><td class="text-center">1.2880<br>12.7900<br>201.29 mg/L<br><strong>Status:</strong> <span class="tag-pass">PASS</span></td><td><strong>K:</strong> 1.067077<br><strong>B:</strong> -0.185172</td></tr>`);
  rows.push(`<tr><td class="font-bold">COD Calibration</td><td>-</td><td>Solution 1<br>Solution 2<br>CRM Reference: 14.8000</td><td class="text-center">10.6100<br>95.2400<br>13.24 mg/L<br><strong>Status:</strong> <span class="tag-pass">PASS</span></td><td><strong>K:</strong> 1.070413<br><strong>B:</strong> -8.484534</td></tr>`);
  rows.push(`<tr><td class="font-bold">BOD Calibration</td><td>-</td><td>Solution 1<br>Solution 2<br>CRM Reference: 9.1800</td><td class="text-center">10.6100<br>95.2400<br><strong>Status:</strong> <span class="tag-pass">PASS</span></td><td><strong>K:</strong> 1.070413<br><strong>B:</strong> -8.484534</td></tr>`);
  rows.push(`<tr><td class="font-bold">pH Calibration</td><td>-</td><td>Solution 1<br>Solution 2<br>Solution 3</td><td class="text-center">3.9700 Unit<br>6.8300 Unit<br>10.0000 Unit<br><strong>Status:</strong> <span class="tag-pass">PASS</span></td><td><strong>K1:</strong> -58.77783<br><strong>K2:</strong> -58.77783<br><strong>K3:</strong> -21.16125<br><strong>K4:</strong> -58.77783<br><strong>K5:</strong> -58.77783<br><strong>K6:</strong> -15.39816</td></tr>`);
  rows.push(`<tr><td class="font-bold">TSS Calibration</td><td>-</td><td>Solution 1<br>CRM Reference: 50.0000</td><td class="text-center">49.9100<br><strong>Status:</strong> <span class="tag-pass">PASS</span></td><td><strong>K:</strong> 0.01409858<br><strong>B:</strong> 0</td></tr>`);
  rows.push(`<tr><td class="font-bold">Amonia Calibration</td><td>-</td><td>Solution 1<br>CRM Reference: 0.8920</td><td class="text-center">1.0100<br><strong>Status:</strong> <span class="tag-pass">PASS</span></td><td><strong>K:</strong> 1<br><strong>B:</strong> 0.238715</td></tr>`);
  rows.push(`<tr><td class="font-bold">Nitrit Calibration</td><td>-</td><td>Solution 1<br>Solution 2<br>CRM Reference: 1.8200</td><td class="text-center">10.1000<br>99.2000<br><strong>Status:</strong> <span class="tag-pass">PASS</span></td><td>-</td></tr>`);
  rows.push(`<tr><td class="font-bold">Nitrat Calibration</td><td>-</td><td>Solution 1<br>Solution 2<br>CRM Reference: 5.4400</td><td class="text-center">10.0200<br>99.5000<br><strong>Status:</strong> <span class="tag-pass">PASS</span></td><td>*Stored internally in probe EEPROM</td></tr>`);
  return rows.join('\n');
}

function buildSampleRows() {
  return `
    <tr>
      <td class="font-bold" style="text-align: left;">Aquades (Blank)</td>
      <td>25.0000</td>
      <td>8.7700</td>
      <td>0.0000</td>
      <td>0.0000</td>
      <td>6.9600</td>
      <td>0.0000</td>
      <td>0.0000</td>
      <td>0.0000</td>
      <td>0.0000</td>
      <td>0.0000</td>
    </tr>
    <tr>
      <td class="font-bold" style="text-align: left;">Water Sample (River)</td>
      <td>25.2000</td>
      <td>6.8500</td>
      <td>145.2000</td>
      <td>12.4000</td>
      <td>7.1500</td>
      <td>18.5000</td>
      <td>4.2000</td>
      <td>15.0000</td>
      <td>0.1200</td>
      <td>2.1000</td>
    </tr>
  `;
}

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const tmplRefact = path.join(projectRoot, 'src', 'views', 'Calibration_Report.html');
  const cssPath = path.join(projectRoot, 'src', 'views', 'Calibration_Report.css');
  const tmplCr = path.join(projectRoot, '.agents', 'cr.html');

  const replacements = {
    '{{REPORT_NO}}': 'CR-2026/VIII/OMS-CMC/001',
    '{{STATION_NAME}}': 'Stasiun Dummy Kalibrasi',
    '{{CALIBRATION_DATE}}': '10 Agustus 2026',
    '{{CONTACT_PERSON}}': '-',
    '{{STATION_ADDRESS}}': 'Jalan Dummy No. 1, Jakarta',
    '{{STATION_COORDINATE}}': '-',
    '{{PHONE}}': '-',
    '{{CALIBRATION_ROWS}}': buildCalRows(),
    '{{SAMPLE_ROWS}}': buildSampleRows(),
    '{{NOTES}}': 'Dummy calibration record for a single station verification flow.',
    '{{QR_CODE_IMAGE}}': 'https://uploads.onecompiler.io/44724abkh/44xgq35xq/qr-code.jpg',
    '{{OFFICER_NAME}}': 'dummy_cal_officer',
    '{{PLACE_DATE}}': '11 Agustus 2026',
  };

  await renderTemplate(tmplRefact, cssPath, replacements, path.join(projectRoot, 'tmp', 'Calibration_Report_refact.pdf'));
  await renderTemplate(tmplCr, null, {}, path.join(projectRoot, 'tmp', 'Calibration_Report_cr.html.pdf'));
}

main().catch((e) => { console.error(e); process.exit(1); });
