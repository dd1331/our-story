import {
  BinetStrategy,
  FibonacciCalculator,
  FibonacciStrategy,
  IterativeStrategy,
  MatrixStrategy,
  MemoizationStrategy,
} from './fibonacci-calculator';

// 순수한 피보나치 서비스 (프레임워크 의존성 없음)
export class FibonacciService {
  private calculator: FibonacciCalculator;

  constructor(strategy: FibonacciStrategy = new MemoizationStrategy()) {
    this.calculator = new FibonacciCalculator(strategy);
  }

  /**
   * 피보나치 계산
   */
  calculate(n: number): bigint {
    return this.calculator.calculate(n);
  }

  /**
   * 현재 전략 이름 반환
   */
  getStrategyName(): string {
    return this.calculator.getStrategyName();
  }

  /**
   * 입력 검증
   */
  static validateInput(n: number): void {
    if (n < 0) {
      throw new Error('음수는 지원하지 않습니다.');
    }
  }

  /**
   * 콘솔 출력 형태의 테스트 케이스
   */
  static runTestCases(): void {
    console.log('=== 피보나치 수열 테스트 케이스 ===');

    const testCases = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50];
    const strategies = [
      new MemoizationStrategy(),
      new IterativeStrategy(),
      new MatrixStrategy(),
      new BinetStrategy(),
    ];

    for (const strategy of strategies) {
      console.log(`\n--- ${strategy.getName()} 전략 ---`);
      const calculator = new FibonacciCalculator(strategy);

      for (const n of testCases) {
        try {
          const startTime = process.hrtime.bigint();
          const result = calculator.calculate(n);
          const endTime = process.hrtime.bigint();
          const duration = Number(endTime - startTime) / 1000000; // 나노초를 밀리초로 변환

          console.log(
            `F(${n}) = ${result.toString()} (${duration.toFixed(3)}ms)`,
          );
        } catch (error) {
          console.log(`F(${n}) = 오류: ${(error as Error).message}`);
        }
      }
    }

    console.log('\n=== 테스트 완료 ===');
  }

  /**
   * 성능 비교 테스트
   */
  static comparePerformance(n: number): void {
    console.log(`\n=== 피보나치 F(${n}) 성능 비교 ===`);

    const strategies = [
      new MemoizationStrategy(),
      new IterativeStrategy(),
      new MatrixStrategy(),
      new BinetStrategy(),
    ];

    const results: Array<{ name: string; result: bigint; time: number }> = [];

    for (const strategy of strategies) {
      const calculator = new FibonacciCalculator(strategy);

      try {
        const startTime = process.hrtime.bigint();
        const result = calculator.calculate(n);
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000;

        results.push({
          name: strategy.getName(),
          result,
          time: duration,
        });

        console.log(
          `${strategy.getName()}: ${result.toString()} (${duration.toFixed(3)}ms)`,
        );
      } catch (error) {
        console.log(
          `${strategy.getName()}: 오류 - ${(error as Error).message}`,
        );
      }
    }

    // 가장 빠른 방법 찾기
    const fastest = results.reduce((min, current) =>
      current.time < min.time ? current : min,
    );

    console.log(
      `\n🏆 가장 빠른 방법: ${fastest.name} (${fastest.time.toFixed(3)}ms)`,
    );
  }
}
