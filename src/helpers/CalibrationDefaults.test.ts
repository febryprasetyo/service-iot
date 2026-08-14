import { getMasterSolutionStandards } from './CalibrationDefaults';

describe('CalibrationDefaults', () => {
  it('should return standards from the master solution table', async () => {
    const trx = jest.fn().mockReturnValue({
      join: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ solution_1: '10.0000', solution_2: '100.0000', solution_3: null })
    });

    await expect(getMasterSolutionStandards(trx as any, 'BOD')).resolves.toEqual([
      { crm_name: '10', crm_standard_value: 10 },
      { crm_name: '100', crm_standard_value: 100 }
    ]);
  });

  it('should omit unused solutions from the master table', async () => {
    const trx = jest.fn().mockReturnValue({
      join: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ solution_1: '4.0000', solution_2: '7.0100', solution_3: '10.0100' })
    });

    await expect(getMasterSolutionStandards(trx as any, 'pH')).resolves.toEqual([
      { crm_name: '4', crm_standard_value: 4 },
      { crm_name: '7.01', crm_standard_value: 7.01 },
      { crm_name: '10.01', crm_standard_value: 10.01 }
    ]);
  });
});
