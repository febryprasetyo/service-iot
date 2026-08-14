/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  const now = new Date();
  const stationName = 'Stasiun Dummy Kalibrasi';
  const userName = 'dummy_cal_officer';
  const reportNo = 'CR-2026/VIII/OMS-CMC/001';
  const verificationUuid = '11111111-1111-1111-1111-111111111111';

  // 1. Ensure dummy user exists
  let user = await knex('users').where({ username: userName }).first();
  if (!user) {
    const [insertedUser] = await knex('users')
      .insert({
        username: userName,
        fullname: 'Dummy Calibration Officer',
        email: 'dummy.officer@example.com',
        password: 'dummy-password',
        phone: '081234567890',
        role_id: 'adm',
        is_active: true,
        created_at: now,
        updated_at: now
      })
      .returning('id');
    user = { id: insertedUser.id || insertedUser };
  }

  // 2. Ensure dummy station exists
  let station = await knex('stations').where({ nama_stasiun: stationName }).first();
  if (!station) {
    const [insertedStation] = await knex('stations')
      .insert({
        nama_stasiun: stationName,
        address: 'Jalan Dummy No. 1, Jakarta',
        province_name: 'DKI Jakarta',
        city_name: 'Jakarta Pusat',
        id_mesin: 'DUMMY-0001',
        created_at: now,
        updated_at: now
      })
      .returning('id');
    station = { id: insertedStation.id || insertedStation };
  }

  // 3. Remove any existing dummy calibration with the same report or verification UUID
  await knex('calibrations').where({ report_no: reportNo }).del();
  await knex('calibrations').where({ verification_uuid: verificationUuid }).del();

  // 4. Insert dummy calibration header
  const [insertedCalibration] = await knex('calibrations')
    .insert({
      report_no: reportNo,
      station_id: station.id,
      calibration_start_date: '2026-08-10',
      calibration_end_date: '2026-08-11',
      notes: 'Dummy calibration record for a single station verification flow.',
      officer_id: user.id,
      status: 'submitted',
      verification_uuid: verificationUuid,
      created_at: now,
      updated_at: now
    })
    .returning('id');
  const calibrationId = insertedCalibration.id || insertedCalibration;

  const parameterDefaults = [
    { parameter_id: 2, parameter_name: 'DO', crm_reference_value: 5.51, crm_reading_value: 3.14, coeff_type: 'K/B', coefficients: { k: 0.999110, b: -0.000024 } },
    { parameter_id: 3, parameter_name: 'Turbidity', crm_reference_value: 4.67, crm_reading_value: 4.64, coeff_type: 'K/B', coefficients: { k: 0.265294, b: -5.970670 } },
    { parameter_id: 4, parameter_name: 'TDS', crm_reference_value: 200, crm_reading_value: 200.36, coeff_type: 'K/B', coefficients: { k: 1.067077, b: -0.185172 } },
    { parameter_id: 9, parameter_name: 'COD', crm_reference_value: 14.8, crm_reading_value: 13.24, coeff_type: 'K/B', coefficients: { k: 1.070413, b: -8.484534 } },
    { parameter_id: 8, parameter_name: 'BOD', crm_reference_value: 9.18, crm_reading_value: 9.24, coeff_type: 'K/B', coefficients: { k: 1.070413, b: -8.484534 } },
    { parameter_id: 5, parameter_name: 'pH', crm_reference_value: null, crm_reading_value: null, coeff_type: 'K1-K6', coefficients: { k1: -58.777830, k2: -58.777830, k3: -21.161250, k4: -58.777830, k5: -58.777830, k6: -15.398160 } },
    { parameter_id: 7, parameter_name: 'TSS', crm_reference_value: 50, crm_reading_value: 49.86, coeff_type: 'K/B', coefficients: { k: 0.01409858, b: 0 } },
    { parameter_id: 10, parameter_name: 'Amonia', crm_reference_value: 0.892, crm_reading_value: 0.90, coeff_type: 'K/B', coefficients: { k: 1.000000, b: 0.238715 } },
    { parameter_id: 12, parameter_name: 'Nitrit', crm_reference_value: 1.82, crm_reading_value: 1.82, coeff_type: null, coefficients: null },
    { parameter_id: 11, parameter_name: 'Nitrat', crm_reference_value: 5.44, crm_reading_value: 5.4, coeff_type: null, coefficients: null }
  ];

  const detailsData = parameterDefaults.map((param) => ({
    calibration_id: calibrationId,
    parameter_id: param.parameter_id,
    coeff_type: param.coeff_type,
    coefficients: param.coefficients ? JSON.stringify(param.coefficients) : null,
    calculation_result: null,
    crm_reference_value: param.crm_reference_value,
    crm_reading_value: param.crm_reading_value,
    remark: null,
    created_at: now,
    updated_at: now
  }));

  await knex('calibration_details').insert(detailsData);

  const details = await knex('calibration_details')
    .where({ calibration_id: calibrationId })
    .select('id', 'parameter_id');

  const standardsByParameter = {
    DO: [
      { crm_name: 'Solution 1', crm_standard_value: 0, calibration_result: 0 },
      { crm_name: 'Solution 2', crm_standard_value: 100, calibration_result: 99.84 }
    ],
    Turbidity: [
      { crm_name: 'Solution 1', crm_standard_value: 4, calibration_result: 3.70 },
      { crm_name: 'Solution 2', crm_standard_value: 20, calibration_result: 19.63 }
    ],
    TDS: [
      { crm_name: 'Solution 1', crm_standard_value: 1.413, calibration_result: 1.288 },
      { crm_name: 'Solution 2', crm_standard_value: 12.89, calibration_result: 12.79 }
    ],
    COD: [
      { crm_name: 'Solution 1', crm_standard_value: 10, calibration_result: 10.61 },
      { crm_name: 'Solution 2', crm_standard_value: 100, calibration_result: 95.24 }
    ],
    BOD: [
      { crm_name: 'Solution 1', crm_standard_value: 10, calibration_result: 10.61 },
      { crm_name: 'Solution 2', crm_standard_value: 100, calibration_result: 95.24 }
    ],
    pH: [
      { crm_name: 'Solution 1', crm_standard_value: 4.00, calibration_result: 3.97 },
      { crm_name: 'Solution 2', crm_standard_value: 7.01, calibration_result: 6.83 },
      { crm_name: 'Solution 3', crm_standard_value: 10.01, calibration_result: 10.00 }
    ],
    TSS: [
      { crm_name: 'Solution 1', crm_standard_value: 50, calibration_result: 49.91 }
    ],
    Amonia: [
      { crm_name: 'Solution 1', crm_standard_value: 1, calibration_result: 1.01 }
    ],
    Nitrit: [
      { crm_name: 'Solution 1', crm_standard_value: 10, calibration_result: 10.1 },
      { crm_name: 'Solution 2', crm_standard_value: 100, calibration_result: 99.2 }
    ],
    Nitrat: [
      { crm_name: 'Solution 1', crm_standard_value: 10, calibration_result: 10.02 },
      { crm_name: 'Solution 2', crm_standard_value: 100, calibration_result: 99.5 }
    ]
  };

  const standardsData = [];
  for (const detail of details) {
    const parameter = parameterDefaults.find((param) => param.parameter_id === detail.parameter_id);
    if (!parameter) continue;
    const standards = standardsByParameter[parameter.parameter_name] || [];
    for (const standard of standards) {
      standardsData.push({
        calibration_detail_id: detail.id,
        crm_name: String(Number(standard.crm_standard_value)),
        crm_standard_value: standard.crm_standard_value,
        min_acceptable: null,
        max_acceptable: null,
        calibration_result: standard.calibration_result,
        created_at: now,
        updated_at: now
      });
    }
  }

  await knex('calibration_detail_standards').insert(standardsData);

  await knex('water_samples').insert([
    {
      calibration_id: calibrationId,
      sample_name: 'Aquades (Blank)',
      suhu: 25.0,
      do: 8.77,
      tur: 0.00,
      tds: 0.00,
      ph: 6.96,
      orp: null,
      tss: 0.00,
      bod: 0.00,
      cod: 0.00,
      amonia: 0.00,
      nitrat: 0.00,
      nitrit: 0.00,
      kedalaman: null,
      created_at: now,
      updated_at: now
    },
    {
      calibration_id: calibrationId,
      sample_name: 'Water Sample (River)',
      suhu: 25.2,
      do: 6.85,
      tur: 12.40,
      tds: 145.20,
      ph: 7.15,
      orp: null,
      tss: 15.00,
      bod: 4.20,
      cod: 18.50,
      amonia: 0.12,
      nitrat: 2.10,
      nitrit: 0.08,
      kedalaman: null,
      created_at: now,
      updated_at: now
    }
  ]);
};
