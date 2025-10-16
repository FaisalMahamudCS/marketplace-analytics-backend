import { Controller, Get, Query, Logger, Param } from '@nestjs/common';
import { ResponseService } from '../services/response.service';
import { ApiResponseService } from '../services/api-response.service';
import {
  MarketplaceResponseWithData,
  ResponseStats,
} from '../persistence/dao/interfaces/response.dao.interface';

@Controller('responses')
export class ResponseController {
  private readonly logger = new Logger(ResponseController.name);

  constructor(
    private readonly responseService: ResponseService,
    private readonly apiResponse: ApiResponseService,
  ) { }

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

    const responses: MarketplaceResponseWithData[] =
      await this.responseService.getAllResponses(limitNum, offsetNum);

    return this.apiResponse.ok(
      responses.map((response) => response.marketplaceData),
      {
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          count: responses.length,
        },
      },
    );
  }
  @Get('/:id')
  async getResponseById(@Param('id') id: string) {
    const response = await this.responseService.getResponseById(id);
    return this.apiResponse.ok(response?.marketplaceData ?? null);
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

    const status: ResponseStats = await this.responseService.getResponseStats();

    return this.apiResponse.ok(status);
  }

  /**
   * Get latest response for real-time updates
   * GET /responses/latest
   */
  @Get('latest')
  async getLatestResponse() {
    this.logger.log('Fetching latest marketplace data');

    const latestResponse = await this.responseService.getLatestResponse();

    return this.apiResponse.ok(
      latestResponse ? latestResponse.marketplaceData : null,
    );
  }
}
