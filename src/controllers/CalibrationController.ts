import { Request, Response } from 'express';
import puppeteer from 'puppeteer';
import { db, sendResponseCustom, sendResponseError, createError, nowWib } from '../utils/util';
import { CalibrationRepository } from '../repositories/CalibrationRepository';
import { CalibrationService } from '../services/CalibrationService';

const calibrationRepository = new CalibrationRepository(db);
const calibrationService = new CalibrationService(calibrationRepository);

class CalibrationController {
  
  /**
   * Create Draft Calibration
   * POST /calibrations
   */
  async create(req: Request, res: Response) {
    try {
      const { station_id, calibration_date, contact_person, phone, parameter_ids } = req.body;
      const user = (req as any).user;

      if (!station_id || !calibration_date || !contact_person || !phone || !parameter_ids || !parameter_ids.length) {
        throw createError('Missing required fields. station_id, calibration_date, contact_person, phone, and parameter_ids are required.', 'E_BAD_REQUEST');
      }

      const officerId = user.user_id;

      const calibrationId = await calibrationService.createCalibrationDraft({
        station_id,
        calibration_date,
        contact_person,
        phone,
        parameter_ids
      }, officerId);

      const data = await db('calibrations').where({ id: calibrationId }).first();

      return sendResponseCustom(res, {
        success: true,
        message: 'Calibration draft created successfully',
        data
      });
    } catch (error: any) {
      return sendResponseError(res, error);
    }
  }

  /**
   * Get Calibration List
   * GET /calibrations
   */
  async list(req: Request, res: Response) {
    try {
      const { limit = 20, offset = 0, status } = req.query;

      const query = db('calibrations').select('*');

      if (status) {
        query.where('status', status);
      }

      const calibrations = await query
        .orderBy('created_at', 'desc')
        .limit(Number(limit))
        .offset(Number(offset));

      const [{ count }] = await db('calibrations')
        .modify((qb) => {
          if (status) qb.where('status', status);
        })
        .count('id as count');

      return sendResponseCustom(res, {
        success: true,
        data: calibrations,
        total: parseInt(count as string)
      });
    } catch (error: any) {
      return sendResponseError(res, error);
    }
  }

  /**
   * Get Calibration Detail
   * GET /calibrations/:id
   */
  async detail(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const calibration = await db('calibrations').where({ id }).first();
      if (!calibration) {
        throw createError('Calibration report not found', 'E_NOT_FOUND');
      }

      const details = await db('calibration_details')
        .where('calibration_id', id);

      // Fetch standard/CRM details for each parameter detail
      const detailIds = details.map((d: any) => d.id);
      let standards: any[] = [];
      if (detailIds.length > 0) {
        standards = await db('calibration_detail_standards')
          .whereIn('calibration_detail_id', detailIds);
      }

      const waterSamples = await db('water_samples')
        .where('calibration_id', id);

      return sendResponseCustom(res, {
        success: true,
        data: {
          ...calibration,
          details: details.map((d: any) => ({
            ...d,
            standards: standards.filter((s: any) => s.calibration_detail_id === d.id)
          })),
          waterSamples
        }
      });
    } catch (error: any) {
      return sendResponseError(res, error);
    }
  }

  /**
   * Save Draft / Staged Calibration Progress
   * PUT /calibrations/:id
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { contact_person, phone, notes, details, waterSamples } = req.body;

      const calibration = await db('calibrations').where({ id }).first();
      if (!calibration) {
        throw createError('Calibration report not found', 'E_NOT_FOUND');
      }

      if (calibration.status !== 'draft') {
        throw createError('Only drafts can be updated', 'E_BAD_REQUEST');
      }

      await db.transaction(async (trx) => {
        // Update header fields
        const headerUpdate: any = { updated_at: nowWib() };
        if (contact_person) headerUpdate.contact_person = contact_person;
        if (phone) headerUpdate.phone = phone;
        if (notes !== undefined) headerUpdate.notes = notes;

        await trx('calibrations').where({ id }).update(headerUpdate);

        // Update details (coefficients, types, calculation_result) and standards (crm_standard_value, calibration_result)
        if (details && details.length > 0) {
          for (const d of details) {
            const detailUpdate: any = { updated_at: nowWib() };
            if (d.coeff_type) detailUpdate.coeff_type = d.coeff_type;
            if (d.coefficients) detailUpdate.coefficients = JSON.stringify(d.coefficients);
            if (d.remark !== undefined) detailUpdate.remark = d.remark;
            if (d.calculation_result) detailUpdate.calculation_result = d.calculation_result;

            await trx('calibration_details').where({ id: d.id, calibration_id: id }).update(detailUpdate);

            // Upsert standard/CRM values
            if (d.standards && d.standards.length > 0) {
              for (const s of d.standards) {
                const standardUpdate: any = {
                  crm_name: s.crm_name,
                  crm_standard_value: s.crm_standard_value,
                  min_acceptable: s.min_acceptable,
                  max_acceptable: s.max_acceptable,
                  calibration_result: s.calibration_result,
                  updated_at: nowWib()
                };

                if (s.id) {
                  await trx('calibration_detail_standards').where({ id: s.id, calibration_detail_id: d.id }).update(standardUpdate);
                } else {
                  await trx('calibration_detail_standards').insert({
                    calibration_detail_id: d.id,
                    ...standardUpdate,
                    created_at: nowWib()
                  });
                }
              }
            }
          }
        }

        // Upsert Water Samples
        if (waterSamples && waterSamples.length > 0) {
          for (const ws of waterSamples) {
            const sampleData = {
              sample_name: ws.sample_name,
              suhu: ws.suhu,
              do: ws.do,
              tur: ws.tur,
              tds: ws.tds,
              ph: ws.ph,
              orp: ws.orp,
              tss: ws.tss,
              bod: ws.bod,
              cod: ws.cod,
              amonia: ws.amonia,
              nitrat: ws.nitrat,
              nitrit: ws.nitrit,
              kedalaman: ws.kedalaman,
              updated_at: nowWib()
            };

            if (ws.id) {
              await trx('water_samples').where({ id: ws.id, calibration_id: id }).update(sampleData);
            } else {
              await trx('water_samples').insert({
                calibration_id: id,
                ...sampleData,
                created_at: nowWib()
              });
            }
          }
        }
      });

      const updated = await db('calibrations').where({ id }).first();

      return sendResponseCustom(res, {
        success: true,
        message: 'Calibration draft updated successfully',
        data: updated
      });
    } catch (error: any) {
      return sendResponseError(res, error);
    }
  }

  /**
   * Delete Calibration
   * DELETE /calibrations/:id
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const calibration = await db('calibrations').where({ id }).first();
      if (!calibration) {
        throw createError('Calibration report not found', 'E_NOT_FOUND');
      }

      await db('calibrations').where({ id }).del();

      return sendResponseCustom(res, {
        success: true,
        message: 'Calibration report deleted successfully'
      });
    } catch (error: any) {
      return sendResponseError(res, error);
    }
  }

  /**
   * Submit Calibration (Finalizes PASS/FAILED calculations and validation)
   * POST /calibrations/:id/submit
   */
  async submit(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const calibration = await db('calibrations').where({ id }).first();
      if (!calibration) {
        throw createError('Calibration report not found', 'E_NOT_FOUND');
      }

      if (calibration.status !== 'draft') {
        throw createError('Only drafts can be submitted', 'E_BAD_REQUEST');
      }

      // Check completeness: all details must have CRM standard results filled
      const details = await db('calibration_details').where({ calibration_id: id });
      if (!details.length) {
        throw createError('Cannot submit calibration with no parameters selected.', 'E_BAD_REQUEST');
      }

      const detailIds = details.map((d: any) => d.id);
      const standards = await db('calibration_detail_standards').whereIn('calibration_detail_id', detailIds);

      for (const d of details) {
        const paramStandards = standards.filter((s: any) => s.calibration_detail_id === d.id);
        if (!paramStandards.length) {
          throw createError(`Parameter detail ID ${d.id} is missing CRM standards.`, 'E_BAD_REQUEST');
        }
        for (const ps of paramStandards) {
          if (ps.calibration_result === null || ps.calibration_result === undefined) {
            throw createError(`Calibration result for CRM standard '${ps.crm_name}' is missing.`, 'E_BAD_REQUEST');
          }
        }
      }

      // Finalize status to submitted
      await db('calibrations').where({ id }).update({
        status: 'submitted',
        updated_at: nowWib()
      });

      return sendResponseCustom(res, {
        success: true,
        message: 'Calibration report submitted successfully',
        data: { id, status: 'submitted' }
      });
    } catch (error: any) {
      return sendResponseError(res, error);
    }
  }

  /**
   * Approve Calibration
   * POST /calibrations/:id/approve
   */
  async approve(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const calibration = await db('calibrations').where({ id }).first();
      if (!calibration) {
        throw createError('Calibration report not found', 'E_NOT_FOUND');
      }

      if (calibration.status !== 'submitted') {
        throw createError('Only submitted calibration reports can be approved', 'E_BAD_REQUEST');
      }

      await db('calibrations').where({ id }).update({
        status: 'approved',
        updated_at: nowWib()
      });

      return sendResponseCustom(res, {
        success: true,
        message: 'Calibration report approved successfully',
        data: { id, status: 'approved' }
      });
    } catch (error: any) {
      return sendResponseError(res, error);
    }
  }

  /**
   * Public Verification Read-Only Endpoint (Anonymous access)
   * GET /verify/:uuid
   */
  async verify(req: Request, res: Response) {
    try {
      const { uuid } = req.params;

      const calibration = await db('calibrations')
        .join('stations', 'calibrations.station_id', '=', 'stations.id') // Assuming stations table has id
        .join('users', 'calibrations.officer_id', '=', 'users.id') // Assuming users table has id
        .where('calibrations.verification_uuid', uuid)
        .select(
          'calibrations.calibration_date',
          'calibrations.status',
          'calibrations.created_at',
          'calibrations.notes',
          'stations.name as station_name',
          'stations.address as station_address',
          'stations.coordinate as station_coordinate',
          'users.username as officer_name'
        )
        .first();

      if (!calibration) {
        throw createError('Verification report not found', 'E_NOT_FOUND');
      }

      // Retrieve public details
      const rawCalibration = await db('calibrations').where('verification_uuid', uuid).first();
      const details = await db('calibration_details')
        .join('master_parameters', 'calibration_details.parameter_id', '=', 'master_parameters.id')
        .where('calibration_details.calibration_id', rawCalibration.id)
        .select(
          'calibration_details.id',
          'master_parameters.name as parameter_name',
          'calibration_details.calculation_result'
        );

      const detailIds = details.map((d: any) => d.id);
      let standards: any[] = [];
      if (detailIds.length > 0) {
        standards = await db('calibration_detail_standards')
          .whereIn('calibration_detail_id', detailIds)
          .select('calibration_detail_id', 'crm_name', 'crm_standard_value', 'calibration_result');
      }

      const waterSamples = await db('water_samples')
        .where('calibration_id', rawCalibration.id);

      return sendResponseCustom(res, {
        success: true,
        data: {
          ...calibration,
          details: details.map((d: any) => ({
            ...d,
            standards: standards.filter((s: any) => s.calibration_detail_id === d.id)
          })),
          waterSamples
        }
      });
    } catch (error: any) {
      return sendResponseError(res, error);
    }
  }

  /**
   * Render HTML Calibration Report for Printing
   * GET /calibrations/:id/print
   */
  async print(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const fs = require('fs');
      const path = require('path');

      // 1. Fetch all data
      const calibration = await db('calibrations')
        .join('stations', 'calibrations.station_id', '=', 'stations.id')
        .join('users', 'calibrations.officer_id', '=', 'users.id')
        .where('calibrations.id', id)
        .select(
          'calibrations.*',
          'stations.name as station_name',
          'stations.address as station_address',
          'stations.coordinate as station_coordinate',
          'users.username as officer_name'
        )
        .first();

      if (!calibration) {
        return res.status(404).send('Calibration report not found');
      }

      const details = await db('calibration_details')
        .join('master_parameters', 'calibration_details.parameter_id', '=', 'master_parameters.id')
        .where('calibration_details.calibration_id', id)
        .select(
          'calibration_details.*',
          'master_parameters.name as parameter_name'
        );

      const detailIds = details.map((d: any) => d.id);
      let standards: any[] = [];
      if (detailIds.length > 0) {
        standards = await db('calibration_detail_standards')
          .whereIn('calibration_detail_id', detailIds);
      }

      const waterSamples = await db('water_samples')
        .where('calibration_id', id);

      // 2. Read template
      const templatePath = path.join(__dirname, '../views/Calibration_Report.html');
      if (!fs.existsSync(templatePath)) {
        return res.status(500).send('Template file not found');
      }
      let html = fs.readFileSync(templatePath, 'utf8');

      // 3. Construct Calibration Details Table Rows
      let calRows = '';
      for (const d of details) {
        const paramStandards = standards.filter((s: any) => s.calibration_detail_id === d.id);
        const crmNames = paramStandards.map(s => s.crm_name).join('<br>');
        const crmResults = paramStandards.map(s => {
          const unit = d.parameter_name === 'pH' ? ' Unit' : '';
          return `${s.calibration_result !== null ? s.calibration_result : '-'} ${unit}`;
        }).join('<br>');
        
        let coeffText = '';
        if (d.coefficients) {
          const coeffs = typeof d.coefficients === 'string' ? JSON.parse(d.coefficients) : d.coefficients;
          coeffText = Object.entries(coeffs)
            .map(([k, v]) => `<strong>${k.toUpperCase()}:</strong> ${v}`)
            .join('<br>');
        }

        const isPass = d.calculation_result === 'PASS';
        const resultClass = isPass ? 'tag-pass' : '';
        const resultText = d.calculation_result ? `<span class="${resultClass}">${d.calculation_result}</span>` : '-';

        calRows += `
          <tr>
            <td class="font-bold">${d.parameter_name} Calibration</td>
            <td class="text-center">${d.remark || '-'}</td>
            <td>${crmNames || '-'}</td>
            <td class="text-center">${crmResults || '-'}</td>
            <td>${coeffText || '-'}</td>
          </tr>
        `;
      }

      // 4. Construct Water Samples Table Rows
      let sampleRows = '';
      for (const ws of waterSamples) {
        sampleRows += `
          <tr>
            <td class="font-bold" style="text-align: left;">${ws.sample_name}</td>
            <td>${ws.suhu !== null ? ws.suhu : '-'}</td>
            <td>${ws.do !== null ? ws.do : '-'}</td>
            <td>${ws.tds !== null ? ws.tds : '-'}</td>
            <td>${ws.tur !== null ? ws.tur : '-'}</td>
            <td>${ws.ph !== null ? ws.ph : '-'}</td>
            <td>${ws.cod !== null ? ws.cod : '-'}</td>
            <td>${ws.bod !== null ? ws.bod : '-'}</td>
            <td>${ws.tss !== null ? ws.tss : '-'}</td>
            <td>${ws.amonia !== null ? ws.amonia : '-'}</td>
            <td>${ws.nitrat !== null ? ws.nitrat : '-'}</td>
          </tr>
        `;
      }

      // 5. Replace placeholders in HTML template
      const formattedDate = new Date(calibration.calibration_date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      html = html
        .replace('Report No: 085/OEM-CAL/CMC/IV/2025', `Report No: ${calibration.report_no}`)
        .replace(': ONLIMO KLHK Stasiun 315', `: ${calibration.station_name}`)
        .replace(': 15 – 16 April 2025', `: ${formattedDate}`)
        .replace(': PT Cahaya Mas Cemerlang / KLHK', `: ${calibration.contact_person}`)
        .replace(': Bendungan Palasari - DAS Ijo Gading, Bali', `: ${calibration.station_address}`)
        .replace(': LAT -8.3272340 | LONG 114.6118410', `: ${calibration.station_coordinate}`)
        .replace(': 021-344 3456', `: ${calibration.phone}`)
        // Replace Table bodies
        .replace(/<table class="cal-table">[\s\S]*?<tbody>[\s\S]*?<\/tbody>/, (match) => {
          return match.replace(/<tbody>[\s\S]*?<\/tbody>/, `<tbody>${calRows}</tbody>`);
        })
        .replace(/<table class="sample-table">[\s\S]*?<tbody>[\s\S]*?<\/tbody>/, (match) => {
          return match.replace(/<tbody>[\s\S]*?<\/tbody>/, `<tbody>${sampleRows}</tbody>`);
        })
        // Replace Notes
        .replace(/<div class="notes-box">[\s\S]*?<\/div>/, `
          <div class="notes-box">
            <strong>Notes:</strong>
            ${calibration.notes || '<ul><li>Tidak ada catatan.</li></ul>'}
          </div>
        `)
        // Replace Signatures
        .replace('Sidnan / Febri Joko Prasetyo', calibration.officer_name);

      // Generate PDF using puppeteer
      const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '12mm', right: '15mm', bottom: '12mm', left: '15mm' } });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=calibration_${id}.pdf`);
        return res.send(pdfBuffer);
      } finally {
        await browser.close();
      }
    } catch (error: any) {
      return res.status(500).send('Error rendering print template: ' + error.message);
    }
  }
}

export default new CalibrationController();
