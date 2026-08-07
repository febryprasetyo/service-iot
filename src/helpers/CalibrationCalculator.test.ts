import { calculateTrueness, evaluateCalibrationResult } from './CalibrationCalculator';

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
});
