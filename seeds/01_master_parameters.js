/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('master_parameters').del();
  
  // Inserts seed entries
  await knex('master_parameters').insert([
    { id: 1, name: 'Suhu', unit: '°C' },
    { id: 2, name: 'DO', unit: 'mg/L' },
    { id: 3, name: 'Turbidity', unit: 'NTU' },
    { id: 4, name: 'TDS', unit: 'mg/L' },
    { id: 5, name: 'pH', unit: null },
    { id: 6, name: 'ORP', unit: 'mV' },
    { id: 7, name: 'TSS', unit: 'mg/L' },
    { id: 8, name: 'BOD', unit: 'mg/L' },
    { id: 9, name: 'COD', unit: 'mg/L' },
    { id: 10, name: 'Amonia', unit: 'mg/L' },
    { id: 11, name: 'Nitrat', unit: 'mg/L' },
    { id: 12, name: 'Nitrit', unit: 'mg/L' },
    { id: 13, name: 'Kedalaman', unit: 'm' }
  ]);
};
