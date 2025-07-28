import { Test, TestingModule } from '@nestjs/testing';
import { FibonacciService } from './fibonacci.service';

describe('FibonacciService', () => {
  let service: FibonacciService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FibonacciService],
    }).compile();

    service = module.get<FibonacciService>(FibonacciService);
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

  describe('strategy pattern', () => {
    it('should start with memoization strategy by default', () => {
      expect(service.getCurrentStrategy()).toBe('memoization');
    });

    it('should change to iterative strategy', () => {
      service.useIterativeStrategy();
      expect(service.getCurrentStrategy()).toBe('iterative');

      // 계산 결과는 동일해야 함
      expect(service.calculate(10).toString()).toBe('55');
    });

    it('should change to matrix strategy', () => {
      service.useMatrixStrategy();
      expect(service.getCurrentStrategy()).toBe('matrix');

      // 계산 결과는 동일해야 함
      expect(service.calculate(10).toString()).toBe('55');
    });

    it('should change to binet strategy', () => {
      service.useBinetStrategy();
      expect(service.getCurrentStrategy()).toBe('binet');

      // 계산 결과는 동일해야 함
      expect(service.calculate(10).toString()).toBe('55');
    });

    it('should change back to memoization strategy', () => {
      service.useIterativeStrategy();
      expect(service.getCurrentStrategy()).toBe('iterative');

      service.useMemoizationStrategy();
      expect(service.getCurrentStrategy()).toBe('memoization');
    });

    it('should maintain calculation consistency across strategies', () => {
      const testCases = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      const strategies = [
        () => service.useMemoizationStrategy(),
        () => service.useIterativeStrategy(),
        () => service.useMatrixStrategy(),
        () => service.useBinetStrategy(),
      ];

      for (const setStrategy of strategies) {
        setStrategy();

        for (const n of testCases) {
          const result = service.calculate(n);
          expect(result.toString()).toBe(getExpectedFibonacci(n));
        }
      }
    });
  });
});

// 예상 피보나치 수열 값
function getExpectedFibonacci(n: number): string {
  const fib = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55];
  return fib[n].toString();
}
