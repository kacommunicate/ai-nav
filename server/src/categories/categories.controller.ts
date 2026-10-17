import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CategoryInput, CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';

class CategoryDto implements CategoryInput {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
}

class SortItemDto {
  id: string;
  sortOrder: number;
}

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Public()
  @Get()
  findActive() {
    return this.categories.findActive();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('admin/list')
  adminList() {
    return this.categories.findAll();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('admin')
  create(@Body() dto: CategoryDto, @Req() req: any) {
    return this.categories.create(dto, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('admin/:id')
  update(@Param('id') id: string, @Body() dto: CategoryDto, @Req() req: any) {
    return this.categories.update(id, dto, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('admin/:id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.categories.remove(id, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('admin/batch/sort')
  batchSort(@Body() body: { items: SortItemDto[] }, @Req() req: any) {
    return this.categories.updateSort(body.items, req.user.id);
  }
}
