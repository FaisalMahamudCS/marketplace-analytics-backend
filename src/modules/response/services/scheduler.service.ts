import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ResponseService } from './response.service';
import { ResponseGateway } from '../gateways/response.gateway';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly responseService: ResponseService,
    private readonly responseGateway: ResponseGateway,
  ) {}

  /**
   * Ping httpbin.org/anything every 5 minutes
   * Cron expression: every 5 minutes
   */
  @Cron('0 */1 * * * *')
  async handlePingHttpBin() {
    this.logger.log('Starting scheduled ping to httpbin.org/anything');

    try {
      await this.responseService.pingHttpBin();

      // Get the latest response and broadcast it
      const latestResponse = await this.responseService.getLatestResponse();
      if (latestResponse) {
        this.responseGateway.broadcastNewResponse(
          latestResponse as unknown as Record<string, unknown>,
        );
        await this.responseGateway.broadcastUpdatedStats();
      }

      this.logger.log('Successfully completed scheduled ping and broadcast');
    } catch (error) {
      this.logger.error('Error in scheduled ping:', error);
    }
  }

  /**
   * Optional: Ping immediately on startup for testing
   */
  async pingOnStartup() {
    this.logger.log('Performing initial ping on startup...');
    await this.handlePingHttpBin();
  }
}
