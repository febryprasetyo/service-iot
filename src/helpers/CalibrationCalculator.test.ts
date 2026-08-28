import { calculateTrueness, evaluateCalibrationResult, formatCoefficient } from './CalibrationCalculator';

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

    it('should return PASS for TSS reading 95 mg/L on CRM 100 mg/L (90-110% range: 90-110)', () => {
      const result = evaluateCalibrationResult(95, 90, 110);
      expect(result).toBe('PASS');
    });

    it('should return PASS for Amonia reading 1.05 mg/L on CRM 1.0 mg/L (90-110% range: 0.9-1.1)', () => {
      const result = evaluateCalibrationResult(1.05, 0.9, 1.1);
      expect(result).toBe('PASS');
    });
  });

  describe('formatCoefficient', () => {
    it('should format number with 6 decimal places', () => {
      expect(formatCoefficient(1.052599)).toBe('1.052599');
      expect(formatCoefficient(-0.087622)).toBe('-0.087622');
      expect(formatCoefficient(1.2)).toBe('1.200000');
      expect(formatCoefficient(0)).toBe('0.000000');
    });

    it('should handle null, undefined, or empty string gracefully', () => {
      expect(formatCoefficient(null)).toBe('-');
      expect(formatCoefficient(undefined)).toBe('-');
      expect(formatCoefficient('')).toBe('-');
    });
  });
});
