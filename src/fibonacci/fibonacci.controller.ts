import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { FibonacciService as CoreFibonacciService } from './core/fibonacci-service';
import { FibonacciResponse } from './dto/fibonacci-response.dto';
import { FibonacciService } from './fibonacci.service';

@Controller('fibonacci')
export class FibonacciController {
  constructor(private readonly fibonacciService: FibonacciService) {}

  @Get(':n')
  getFibonacci(@Param('n', ParseIntPipe) n: number): FibonacciResponse {
    // 입력 검증
    try {
      CoreFibonacciService.validateInput(n);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }

    // 계산 실행
    const result = this.fibonacciService.calculate(n);
    const strategy = this.fibonacciService.getCurrentStrategy();

    // 응답 생성
    return FibonacciResponse.create(strategy, n, result);
  }

  @Post('strategy')
  setStrategy(@Body() body: { strategy: string }): {
    success: boolean;
    message: string;
  } {
    const { strategy } = body;

    switch (strategy.toLowerCase()) {
      case 'memoization':
        this.fibonacciService.useMemoizationStrategy();
        return {
          success: true,
          message: '메모이제이션 전략으로 변경되었습니다.',
        };

      case 'iterative':
        this.fibonacciService.useIterativeStrategy();
        return { success: true, message: '반복문 전략으로 변경되었습니다.' };

      case 'matrix':
        this.fibonacciService.useMatrixStrategy();
        return {
          success: true,
          message: '행렬 거듭제곱 전략으로 변경되었습니다.',
        };

      case 'binet':
        this.fibonacciService.useBinetStrategy();
        return {
          success: true,
          message: 'Binet 공식 전략으로 변경되었습니다.',
        };

      default:
        throw new BadRequestException(
          '지원하지 않는 전략입니다. (memoization, iterative, matrix, binet)',
        );
    }
  }

  @Get('strategy/current')
  getCurrentStrategy(): { strategy: string } {
    return { strategy: this.fibonacciService.getCurrentStrategy() };
  }
}
