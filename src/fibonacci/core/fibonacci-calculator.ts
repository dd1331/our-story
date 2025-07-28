// 순수한 피보나치 계산 클래스 (프레임워크 의존성 없음)
export interface FibonacciStrategy {
  calculate(n: number): bigint;
  getName(): string;
}

export class FibonacciCalculator {
  constructor(private readonly strategy: FibonacciStrategy) {}

  calculate(n: number): bigint {
    return this.strategy.calculate(n);
  }

  getStrategyName(): string {
    return this.strategy.getName();
  }
}

// 메모이제이션 전략 (기본 전략) - O(n) 시간, O(n) 공간
export class MemoizationStrategy implements FibonacciStrategy {
  private memo: Map<number, bigint> = new Map();

  calculate(n: number): bigint {
    if (n <= 0) return 0n;
    if (n === 1) return 1n;

    if (this.memo.has(n)) {
      return this.memo.get(n)!;
    }

    const result = this.calculate(n - 1) + this.calculate(n - 2);
    this.memo.set(n, result);
    return result;
  }

  getName(): string {
    return 'memoization';
  }
}

// 반복문 전략 - O(n) 시간, O(1) 공간
export class IterativeStrategy implements FibonacciStrategy {
  calculate(n: number): bigint {
    if (n <= 0) return 0n;
    if (n === 1) return 1n;

    let prev = 0n;
    let current = 1n;

    for (let i = 2; i <= n; i++) {
      const next = prev + current;
      prev = current;
      current = next;
    }

    return current;
  }

  getName(): string {
    return 'iterative';
  }
}

// 행렬 거듭제곱 전략 - O(log n) 시간, O(1) 공간
export class MatrixStrategy implements FibonacciStrategy {
  calculate(n: number): bigint {
    if (n <= 0) return 0n;
    if (n === 1) return 1n;

    const matrix = this.matrixPower(
      [
        [1n, 1n],
        [1n, 0n],
      ],
      n - 1,
    );
    return matrix[0][0];
  }

  private matrixPower(matrix: bigint[][], power: number): bigint[][] {
    if (power === 0)
      return [
        [1n, 0n],
        [0n, 1n],
      ];
    if (power === 1) return matrix;

    if (power % 2 === 0) {
      const half = this.matrixPower(matrix, power / 2);
      return this.matrixMultiply(half, half);
    } else {
      const half = this.matrixPower(matrix, (power - 1) / 2);
      return this.matrixMultiply(this.matrixMultiply(half, half), matrix);
    }
  }

  private matrixMultiply(a: bigint[][], b: bigint[][]): bigint[][] {
    return [
      [
        a[0][0] * b[0][0] + a[0][1] * b[1][0],
        a[0][0] * b[0][1] + a[0][1] * b[1][1],
      ],
      [
        a[1][0] * b[0][0] + a[1][1] * b[1][0],
        a[1][0] * b[0][1] + a[1][1] * b[1][1],
      ],
    ];
  }

  getName(): string {
    return 'matrix';
  }
}

// Binet 공식 전략 - O(1) 시간, O(1) 공간 (정확도 제한)
export class BinetStrategy implements FibonacciStrategy {
  calculate(n: number): bigint {
    if (n <= 0) return 0n;
    if (n === 1) return 1n;

    const phi = (1 + Math.sqrt(5)) / 2;
    const psi = (1 - Math.sqrt(5)) / 2;

    const result = (Math.pow(phi, n) - Math.pow(psi, n)) / Math.sqrt(5);
    return BigInt(Math.round(result));
  }

  getName(): string {
    return 'binet';
  }
}
