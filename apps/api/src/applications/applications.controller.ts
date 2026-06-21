import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@UseGuards(JwtAuthGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateApplicationDto) {
    return this.applicationsService.create(user.userId, dto);
  }

  @Get('board')
  board(@CurrentUser() user: CurrentUserPayload) {
    return this.applicationsService.listBoard(user.userId);
  }

  @Get('analytics')
  analytics(@CurrentUser() user: CurrentUserPayload) {
    return this.applicationsService.getAnalytics(user.userId);
  }

  @Get('weekly-report')
  weeklyReport(@CurrentUser() user: CurrentUserPayload) {
    return this.applicationsService.getWeeklyReport(user.userId);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationDto,
  ) {
    return this.applicationsService.update(user.userId, id, dto);
  }

  @Delete(':id')
  delete(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.applicationsService.delete(user.userId, id);
  }
}
