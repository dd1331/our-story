import { FibonacciService } from './fibonacci-service';

describe('FibonacciService (Core)', () => {
  let service: FibonacciService;

  beforeEach(() => {
    service = new FibonacciService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculate', () => {
    it('should return 0 for n = 0', () => {
      expect(service.calculate(0).toString()).toBe('0');
    });

    it('should return 1 for n = 1', () => {
      expect(service.calculate(1).toString()).toBe('1');
    });

    it('should return correct fibonacci numbers', () => {
      expect(service.calculate(2).toString()).toBe('1');
      expect(service.calculate(3).toString()).toBe('2');
      expect(service.calculate(4).toString()).toBe('3');
      expect(service.calculate(5).toString()).toBe('5');
      expect(service.calculate(6).toString()).toBe('8');
      expect(service.calculate(7).toString()).toBe('13');
    });
  });

  describe('validateInput', () => {
    it('should not throw for valid input', () => {
      expect(() => FibonacciService.validateInput(0)).not.toThrow();
      expect(() => FibonacciService.validateInput(1)).not.toThrow();
      expect(() => FibonacciService.validateInput(100)).not.toThrow();
    });

    it('should throw for negative input', () => {
      expect(() => FibonacciService.validateInput(-1)).toThrow(
        '음수는 지원하지 않습니다.',
      );
      expect(() => FibonacciService.validateInput(-10)).toThrow(
        '음수는 지원하지 않습니다.',
      );
    });
  });
});
