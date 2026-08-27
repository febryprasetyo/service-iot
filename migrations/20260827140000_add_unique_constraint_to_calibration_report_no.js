/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasCalibrations = await knex.schema.hasTable('calibrations');
  if (!hasCalibrations) return;

  // 1. Resolve specific known duplicates from 2026-08-27
  await knex('calibrations')
    .where({ id: 'f75c9db9-3f9f-4f4f-b753-3e42180987c6', report_no: 'CR-2026/VIII/OMS-CMC/008' })
    .update({ report_no: 'CR-2026/VIII/OMS-CMC/010' });

  await knex('calibrations')
    .where({ id: '3a34253c-8032-400e-99d8-d2cd04146fcb', report_no: 'CR-2026/VIII/OMS-CMC/009' })
    .update({ report_no: 'CR-2026/VIII/OMS-CMC/011' });

  // 2. Generic safeguard: if any other duplicates remain, dynamically re-assign them to next max seq
  const duplicatesQuery = await knex.raw(`
    SELECT report_no
    FROM calibrations
    GROUP BY report_no
    HAVING count(*) > 1
  `);

  const duplicates = duplicatesQuery.rows || duplicatesQuery || [];
  for (const dup of duplicates) {
    const reportNo = dup.report_no;
    // Get all records with this report_no ordered by created_at ascending
    const records = await knex('calibrations')
      .where({ report_no: reportNo })
      .orderBy('created_at', 'asc')
      .orderBy('id', 'asc')
      .select('id', 'report_no', 'created_at');

    // Keep the first (oldest) record; renumber subsequent records
    for (let i = 1; i < records.length; i++) {
      const recordToUpdate = records[i];
      const match = String(recordToUpdate.report_no).match(/^(CR-(\d{4})\/([^\/]+)\/OMS-CMC\/)(\d+)$/);
      if (match) {
        const [, prefixWithMonth, yearStr] = match;
        // Find current max seq for this year
        const maxRes = await knex.raw(`
          SELECT COALESCE(MAX(SUBSTRING(report_no FROM '([0-9]+)$')::integer), 0) AS max_seq
          FROM calibrations
          WHERE report_no LIKE ?
        `, [`CR-${yearStr}/%`]);
        const maxSeq = Number(maxRes?.rows?.[0]?.max_seq || 0);
        const newSeq = String(maxSeq + 1).padStart(3, '0');
        const newReportNo = `${prefixWithMonth}${newSeq}`;
        await knex('calibrations').where({ id: recordToUpdate.id }).update({ report_no: newReportNo });
      }
    }
  }

  // 3. Add UNIQUE constraint to prevent duplicate report_no in the future
  const hasConstraint = await knex.raw(`
    SELECT conname 
    FROM pg_constraint 
    WHERE conname = 'calibrations_report_no_unique'
  `);
  if (!hasConstraint.rows || hasConstraint.rows.length === 0) {
    await knex.schema.alterTable('calibrations', function(table) {
      table.unique('report_no', 'calibrations_report_no_unique');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const hasCalibrations = await knex.schema.hasTable('calibrations');
  if (!hasCalibrations) return;

  const hasConstraint = await knex.raw(`
    SELECT conname 
    FROM pg_constraint 
    WHERE conname = 'calibrations_report_no_unique'
  `);
  if (hasConstraint.rows && hasConstraint.rows.length > 0) {
    await knex.schema.alterTable('calibrations', function(table) {
      table.dropUnique('report_no', 'calibrations_report_no_unique');
    });
  }
};

