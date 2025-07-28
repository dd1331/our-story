// 응답 DTO 클래스들
export class FibonacciResponse {
  constructor(
    public readonly method: string,
    public readonly input: number,
    public readonly result: string,
    public readonly timestamp: string,
  ) {}

  static create(
    method: string,
    input: number,
    result: bigint,
  ): FibonacciResponse {
    return new FibonacciResponse(
      method,
      input,
      result.toString(),
      new Date().toISOString(),
    );
  }
}
