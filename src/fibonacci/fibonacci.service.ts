import { Injectable } from '@nestjs/common';
import {
  BinetStrategy,
  FibonacciStrategy,
  IterativeStrategy,
  MatrixStrategy,
  MemoizationStrategy,
} from './core/fibonacci-calculator';
import { FibonacciService as CoreFibonacciService } from './core/fibonacci-service';

@Injectable()
export class FibonacciService {
  private coreService: CoreFibonacciService;

  constructor() {
    // 기본 전략으로 메모이제이션 사용
    this.coreService = new CoreFibonacciService(new MemoizationStrategy());
  }

  /**
   * 피보나치 계산
   */
  calculate(n: number): bigint {
    return this.coreService.calculate(n);
  }

  /**
   * 전략 변경
   */
  setStrategy(strategy: FibonacciStrategy): void {
    this.coreService = new CoreFibonacciService(strategy);
  }

  /**
   * 메모이제이션 전략으로 변경
   */
  useMemoizationStrategy(): void {
    this.setStrategy(new MemoizationStrategy());
  }

  /**
   * 반복문 전략으로 변경
   */
  useIterativeStrategy(): void {
    this.setStrategy(new IterativeStrategy());
  }

  /**
   * 행렬 거듭제곱 전략으로 변경
   */
  useMatrixStrategy(): void {
    this.setStrategy(new MatrixStrategy());
  }

  /**
   * Binet 공식 전략으로 변경
   */
  useBinetStrategy(): void {
    this.setStrategy(new BinetStrategy());
  }

  /**
   * 현재 전략 이름 반환
   */
  getCurrentStrategy(): string {
    return this.coreService.getStrategyName();
  }
}
