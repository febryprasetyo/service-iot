#!/usr/bin/env node

/*
 * API integration test for the Calibration Report fixture. It creates a draft,
 * saves all input values, verifies the detail and printable report, then deletes
 * the draft in finally so the test leaves no calibration record behind.
 *
 * Required environment variables:
 *   CALIBRATION_TEST_USERNAME, CALIBRATION_TEST_PASSWORD,
 *   CALIBRATION_TEST_STATION_ID, CALIBRATION_TEST_PARAMETER_IDS
 */
const assert = require('node:assert/strict');
const axios = require('axios');
const fixture = require('./calibration-report-klhk299-e2e-input.json');

const baseUrl = process.env.CALIBRATION_API_BASE_URL || 'http://localhost:3304/api';
const username = process.env.CALIBRATION_TEST_USERNAME;
const password = process.env.CALIBRATION_TEST_PASSWORD;
const stationId = Number(process.env.CALIBRATION_TEST_STATION_ID);
const parameterIds = (process.env.CALIBRATION_TEST_PARAMETER_IDS || '')
  .split(',')
  .map((id) => Number(id.trim()))
  .filter(Number.isFinite);

if (!username || !password || !Number.isInteger(stationId) || parameterIds.length !== fixture.details.length) {
  throw new Error('Set username, password, station ID, and all 10 parameter IDs before running this test.');
}

const solutionValues = {
  DO: [0, 100],
  Turbidity: [4, 20],
  TDS: [1.413, 12.89],
  pH: [4, 7.01, 10.01],
  TSS: [50],
  BOD: [10, 100],
  COD: [10, 100],
  Amonia: [1],
  Nitrat: [10, 100],
  Nitrit: [10, 100]
};

async function run() {
  const login = await axios.post(`${baseUrl}/auth/login`, { username, password });
  const token = login.data?.token?.access_token;
  assert.ok(token, 'Login harus menghasilkan access token.');
  const client = axios.create({ headers: { Authorization: `Bearer ${token}` } });
  const masterParameters = await client.get(`${baseUrl}/calibrations/parameters`);
  const masterParameterData = masterParameters.data?.data || [];
  assert.deepEqual(
    masterParameterData
      .filter((parameter) => fixture.details.some((detail) => detail.parameter === parameter.name))
      .map((parameter) => parameter.id)
      .sort((left, right) => left - right),
    [...parameterIds].sort((left, right) => left - right),
    'Master parameter harus menyediakan ID untuk seluruh fixture tanpa hard-code frontend.'
  );
  assert.deepEqual(
    masterParameterData.find((parameter) => parameter.name === 'TDS')?.standards
      .map((standard) => standard.crm_standard_value),
    [1.413, 12.89]
  );
  let calibrationId;

  try {
    const created = await client.post(`${baseUrl}/calibrations`, {
      station_id: stationId,
      calibration_start_date: fixture.calibration.start_date,
      calibration_end_date: fixture.calibration.end_date,
      parameter_ids: parameterIds
    });
    const createdDraft = created.data?.data;
    calibrationId = createdDraft?.id;
    assert.ok(calibrationId, 'POST /calibrations harus membuat draft.');
    assert.equal(createdDraft.station_id, stationId);
    assert.equal(createdDraft.status, 'draft');
    assert.match(createdDraft.report_no, /^CR-\d{4}\/[IVXLCDM]+\/OMS-CMC\/\d{3}$/);
    assert.match(
      createdDraft.verification_uuid,
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    const expectedVerificationUrl = process.env.PUBLIC_CALIBRATION_FRONTEND_URL
      ? `${process.env.PUBLIC_CALIBRATION_FRONTEND_URL.replace(/\/$/, '')}/verify/${createdDraft.verification_uuid}`
      : new RegExp(`/api/verify/${createdDraft.verification_uuid}$`);
    if (typeof expectedVerificationUrl === 'string') {
      assert.equal(createdDraft.verification_url, expectedVerificationUrl);
    } else {
      assert.match(createdDraft.verification_url, expectedVerificationUrl);
    }
    assert.match(createdDraft.qr_code_data_url, /^data:image\/png;base64,/);

    const initialDetail = await client.get(`${baseUrl}/calibrations/${calibrationId}`);
    const currentDetails = initialDetail.data?.data?.details || [];
    assert.equal(currentDetails.length, fixture.details.length, 'Semua parameter harus dibuat.');

    const detailByParameter = new Map(currentDetails.map((detail) => [detail.parameter_name, detail]));
    const updateDetails = fixture.details.map((input) => {
      const persisted = detailByParameter.get(input.parameter);
      assert.ok(persisted, `Detail ${input.parameter} tidak ditemukan.`);
      return {
        id: persisted.id,
        coeff_type: input.coefficient_type,
        coefficients: input.coefficients,
        crm_reference_value: input.crm_reference_value,
        crm_reading_value: input.crm_reading_value,
        standards: input.standards.map((standard, index) => {
          const persistedStandard = persisted.standards[index];
          assert.ok(persistedStandard?.id, `ID standard ${input.parameter}/${standard.solution} tidak ditemukan.`);
          return {
            id: persistedStandard.id,
            crm_name: persistedStandard.crm_name,
            calibration_result: standard.calibration_result
          };
        })
      };
    });

    await client.put(`${baseUrl}/calibrations/${calibrationId}`, {
      details: updateDetails,
      waterSamples: fixture.water_samples
    });

    const saved = await client.get(`${baseUrl}/calibrations/${calibrationId}`);
    const report = saved.data?.data;
    assert.equal(report.id, calibrationId);
    assert.equal(report.station_id, stationId);
    assert.equal(report.status, 'draft');
    assert.equal(report.report_no, createdDraft.report_no);
    assert.equal(report.verification_uuid, createdDraft.verification_uuid);
    if (typeof expectedVerificationUrl === 'string') {
      assert.equal(report.verification_url, expectedVerificationUrl.replace(createdDraft.verification_uuid, report.verification_uuid));
    } else {
      assert.match(report.verification_url, new RegExp(`/api/verify/${report.verification_uuid}$`));
    }
    assert.match(report.qr_code_data_url, /^data:image\/png;base64,/);
    assert.equal(report.station_name, fixture.station.name);
    assert.equal(report.calibration_start_date, fixture.calibration.start_date);
    assert.equal(report.calibration_end_date, fixture.calibration.end_date);
    assert.equal(report.officer_name.toLowerCase(), fixture.calibration.officer.toLowerCase());
    assert.equal(report.details.length, fixture.details.length);
    assert.equal(report.waterSamples.length, fixture.water_samples.length);

    for (const input of fixture.details) {
      const detail = report.details.find((item) => item.parameter_name === input.parameter);
      assert.ok(detail, `${input.parameter} harus tersimpan.`);
      assert.ok(Number.isInteger(detail.id), `ID detail ${input.parameter} harus tersedia untuk autosave.`);
      assert.equal(
        detail.crm_reference_value === null ? null : Number(detail.crm_reference_value),
        input.crm_reference_value
      );
      assert.equal(
        detail.crm_reading_value === null ? null : Number(detail.crm_reading_value),
        input.crm_reading_value
      );
      assert.deepEqual(
        detail.standards.map((standard) => Number(standard.crm_standard_value)),
        solutionValues[input.parameter],
        `Solution standard ${input.parameter} harus berasal dari master.`
      );
      assert.deepEqual(
        detail.standards.map((standard) => standard.crm_name),
        solutionValues[input.parameter].map((value) => String(value)),
        `crm_name ${input.parameter} harus siap tampil sebagai nilai standard.`
      );
      assert.deepEqual(
        detail.standards.map((standard) => Number(standard.calibration_result)),
        input.standards.map((standard) => standard.calibration_result)
      );
      assert.ok(
        detail.standards.every((standard) => Number.isInteger(standard.id)),
        `ID standard ${input.parameter} harus tersedia untuk autosave.`
      );
    }

    console.log(JSON.stringify({
      calibration_id: report.id,
      station_id: report.station_id,
      report_no: report.report_no,
      status: report.status,
      verification_uuid: report.verification_uuid,
      details: report.details.map((detail) => ({
        id: detail.id,
        parameter: detail.parameter_name,
        standards: detail.standards.map((standard) => ({ id: standard.id, crm_name: standard.crm_name }))
      }))
    }, null, 2));

    const printed = await client.get(`${baseUrl}/calibrations/${calibrationId}/print`, {
      responseType: 'arraybuffer'
    });
    assert.match(String(printed.headers['content-type']), /application\/pdf/);
    assert.ok(printed.data.byteLength > 0, 'Print harus menghasilkan PDF.');
    console.log(`PASS: Calibration API fixture berhasil diuji (${calibrationId}).`);
  } finally {
    if (calibrationId) {
      await client.delete(`${baseUrl}/calibrations/${calibrationId}`);
      console.log(`Cleanup: draft ${calibrationId} dihapus.`);
    }
  }
}

run().catch((error) => {
  console.error(error.response?.data || error.message);
  process.exitCode = 1;
});
