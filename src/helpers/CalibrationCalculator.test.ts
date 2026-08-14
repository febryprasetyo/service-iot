import { calculateTrueness, evaluateCalibrationResult, evaluateStandardMeasurement } from './CalibrationCalculator';

describe('CalibrationCalculator', () => {
  describe('calculateTrueness', () => {
    it('should correctly calculate the trueness percentage', () => {
      const reading = 19.5;
      const standard = 20.0;
      
      const trueness = calculateTrueness(reading, standard);
      
      expect(trueness).toBe(97.5);
    });

    it('should return 0 if the standard is 0 to avoid division by zero', () => {
      const reading = 5;
      const standard = 0;
      
      const trueness = calculateTrueness(reading, standard);
      
      expect(trueness).toBe(0);
    });
  });

  describe('evaluateCalibrationResult', () => {
    it('should return PASS if reading is exactly within boundaries', () => {
      const result = evaluateCalibrationResult(19.5, 18.0, 22.0);
      expect(result).toBe('PASS');
    });

    it('should return FAILED if reading is below minimum boundary', () => {
      const result = evaluateCalibrationResult(17.9, 18.0, 22.0);
      expect(result).toBe('FAILED');
    });

    it('should return FAILED if reading is above maximum boundary', () => {
      const result = evaluateCalibrationResult(22.1, 18.0, 22.0);
      expect(result).toBe('FAILED');
    });

    it('should return PASS if reading equals the minimum boundary', () => {
      const result = evaluateCalibrationResult(18.0, 18.0, 22.0);
      expect(result).toBe('PASS');
    });
  });

  describe('evaluateStandardMeasurement', () => {
    it('should evaluate BOD using %Trueness 90–110', () => {
      expect(evaluateStandardMeasurement('BOD', 99.92, 100)).toMatchObject({
        value: 99.92,
        min: 90,
        max: 110,
        status: 'PASS'
      });
    });

    it('should evaluate COD using %Trueness 90–110', () => {
      expect(evaluateStandardMeasurement('COD', 10.61, 10)).toMatchObject({
        value: 106.1,
        min: 90,
        max: 110,
        status: 'PASS'
      });
      expect(evaluateStandardMeasurement('COD', 95.24, 100)?.status).toBe('PASS');
    });

    it('should evaluate pH with an absolute accuracy of ±0.20', () => {
      const result = evaluateStandardMeasurement('pH', 6.83, 7.01);
      expect(result).toMatchObject({ min: 6.81, max: 7.21, status: 'PASS' });
      expect(result?.value).toBeCloseTo(0.18, 10);
    });

    it('should evaluate the DO zero point with ±0.05 accuracy', () => {
      expect(evaluateStandardMeasurement('DO', 0.05, 0)).toMatchObject({
        value: 0.05,
        min: -0.05,
        max: 0.05,
        status: 'PASS'
      });
      expect(evaluateStandardMeasurement('DO', 0.051, 0)?.status).toBe('FAILED');
    });

    it('should evaluate Turbidity using %Trueness 90–110', () => {
      expect(evaluateStandardMeasurement('Turbidity', 3.7, 4)).toMatchObject({
        status: 'PASS',
        value: 92.5,
        min: 90,
        max: 110
      });
      const turbidityResult = evaluateStandardMeasurement('Turbidity', 19.63, 20);
      expect(turbidityResult).toMatchObject({ status: 'PASS', min: 90, max: 110 });
      expect(turbidityResult?.value).toBeCloseTo(98.15, 10);
    });

    it('should evaluate TDS using %Trueness 90–110', () => {
      const tdsResult = evaluateStandardMeasurement('TDS', 1.288, 1.413);
      expect(tdsResult?.status).toBe('PASS');
      expect(tdsResult?.value).toBeCloseTo(91.15, 2);
      expect(evaluateStandardMeasurement('TDS', 12.79, 12.89)?.status).toBe('PASS');
    });

    it('should evaluate COD and BOD using %Trueness 90–110', () => {
      expect(evaluateStandardMeasurement('COD', 10.61, 10)).toMatchObject({
        status: 'PASS',
        value: 106.1,
        min: 90,
        max: 110
      });
      expect(evaluateStandardMeasurement('BOD', 95.24, 100)).toMatchObject({
        status: 'PASS',
        value: 95.24,
        min: 90,
        max: 110
      });
    });

    it('should evaluate TSS using %Trueness 99–100', () => {
      expect(evaluateStandardMeasurement('TSS', 49.91, 50)).toMatchObject({
        status: 'PASS',
        value: 99.82,
        min: 99,
        max: 100
      });
    });

    it('should evaluate Amonia using %Trueness 99–101', () => {
      expect(evaluateStandardMeasurement('Amonia', 1.01, 1)).toMatchObject({
        status: 'PASS',
        value: 101,
        min: 99,
        max: 101
      });
    });

    it('should evaluate Nitrat and Nitrit using %Trueness 90–110', () => {
      expect(evaluateStandardMeasurement('Nitrat', 10.02, 10)).toMatchObject({
        status: 'PASS',
        value: 100.2,
        min: 90,
        max: 110
      });
      expect(evaluateStandardMeasurement('Nitrit', 99.2, 100)).toMatchObject({
        status: 'PASS',
        value: 99.2,
        min: 90,
        max: 110
      });
    });
  });
});
