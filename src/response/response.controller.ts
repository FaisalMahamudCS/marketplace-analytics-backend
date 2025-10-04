import { Controller, Get, Query, Logger } from '@nestjs/common';
import { ResponseService, ResponseStats } from './response.service';

@Controller('responses')
export class ResponseController {
  private readonly logger = new Logger(ResponseController.name);

  constructor(private readonly responseService: ResponseService) { }

  /**
   * Get all historical response data
   * GET /responses?limit=100&offset=0
   */
  @Get()
  async getAllResponses(
    @Query('limit') limit: string = '100',
    @Query('offset') offset: string = '0',
  ) {
    const limitNum = parseInt(limit, 10) || 100;
    const offsetNum = parseInt(offset, 10) || 0;

    this.logger.log(
      `Fetching responses - Limit: ${limitNum}, Offset: ${offsetNum}`,
    );

    const responses = await this.responseService.getAllResponses(
      limitNum,
      offsetNum,
    );

    return {
      success: true,
      data: responses,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        count: responses.length,
      },
    };
  }

  /**
   * Get response statistics
   * GET /responses/stats
   */
  @Get('stats')
  async getResponseStats(): Promise<{
    success: boolean;
    data: ResponseStats;
  }> {
    this.logger.log('Fetching response statistics');

    const stats: ResponseStats = await this.responseService.getResponseStats();

    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Get latest response for real-time updates
   * GET /responses/latest
   */
  @Get('latest')
  async getLatestResponse() {
    this.logger.log('Fetching latest response');

    const latestResponse = await this.responseService.getLatestResponse();

    return {
      success: true,
      data: latestResponse,
    };
  }
}
