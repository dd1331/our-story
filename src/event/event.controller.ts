import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApplyPointsDto } from './dto/apply-points.dto';
import { EventService } from './event.service';

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  /**
   * 포인트 신청 API
   * POST /event/apply
   */
  @Post('apply')
  @HttpCode(HttpStatus.CREATED)
  async applyForPoints(@Body() applyDto: ApplyPointsDto): Promise<{
    success: boolean;
    data: {
      userId: string;
      orderNumber: number;
      points: number;
      timestamp: Date;
    };
    message: string;
  }> {
    // 유효성 검사
    if (!applyDto.userId || applyDto.userId.trim() === '') {
      throw new BadRequestException('userId는 필수이며 비어있을 수 없습니다.');
    }

    const allocation = await this.eventService.applyForPoints(applyDto.userId);

    return {
      success: true,
      data: allocation,
      message: `포인트 신청이 완료되었습니다. ${allocation.orderNumber}번째 참가자로 ${allocation.points.toLocaleString()}포인트가 지급됩니다.`,
    };
  }
}
