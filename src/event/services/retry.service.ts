import { Injectable } from '@nestjs/common';

@Injectable()
export class RetryService {
  delegateToExternalRetryService(error: Error) {
    console.error(error);
    console.log('이벤트나 큐 등의 외부에서 재시도 가능한 형태로 위임합니다');
  }
}
