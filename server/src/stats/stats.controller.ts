import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('stats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('overview')
  overview() {
    return this.stats.overview();
  }

  @Get('trend')
  trend(@Query('days') days?: string) {
    return this.stats.trend(Math.min(90, Math.max(1, Number(days) || 14)));
  }

  @Get('by-category')
  byCategory() {
    return this.stats.byCategory();
  }

  @Get('tool/:id/trend')
  toolTrend(@Param('id') id: string, @Query('days') days?: string) {
    return this.stats.toolTrend(id, Math.min(90, Math.max(1, Number(days) || 14)));
  }
}
