import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Pricing, ToolStatus } from '@prisma/client';
import { CreateToolInput, ToolsService, ToolQuery } from './tools.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';

class CreateToolDto implements CreateToolInput {
  name: string;
  url: string;
  description: string;
  categoryId: string;
  logo?: string;
  pricing?: Pricing;
  needsVpn?: boolean;
  zhSupport?: boolean;
  featured?: boolean;
  sortOrder?: number;
  status?: ToolStatus;
  tags?: string[];
}

class UpdateToolDto extends CreateToolDto {}

class SortItemDto {
  id: string;
  sortOrder: number;
}

class ImportDto {
  tools: CreateToolInput[];
}

@ApiTags('tools')
@Controller('tools')
export class ToolsController {
  constructor(private readonly tools: ToolsService) {}

  // ---------- 公开 ----------

  @Public()
  @Get()
  findPublished(@Query() query: ToolQuery) {
    return this.tools.findPublished(query);
  }

  @Public()
  @Get('top')
  top(@Query('limit') limit?: string) {
    return this.tools.findTop(Number(limit) || 10);
  }

  @Public()
  @Get(':idOrSlug')
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.tools.findOnePublished(idOrSlug);
  }

  @Public()
  @Post(':id/click')
  click(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.tools.registerClick(id, {
      ip: req.ip || req.socket?.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
      referer: req.headers['referer'] || '',
    });
  }

  // ---------- 管理 ----------

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('admin/list')
  adminList(@Query() query: ToolQuery) {
    return this.tools.findAll(query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('admin')
  create(@Body() dto: CreateToolDto, @Req() req: any) {
    return this.tools.create(dto, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('admin/:id')
  update(@Param('id') id: string, @Body() dto: UpdateToolDto, @Req() req: any) {
    return this.tools.update(id, dto, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('admin/:id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.tools.remove(id, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('admin/batch/sort')
  batchSort(@Body() body: { items: SortItemDto[] }, @Req() req: any) {
    return this.tools.updateSort(body.items, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('admin/import')
  import(@Body() body: ImportDto, @Req() req: any) {
    return this.tools.importMany(body.tools || [], req.user.id);
  }
}
