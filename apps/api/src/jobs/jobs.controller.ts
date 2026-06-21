import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JobsService } from './jobs.service';
import { JobSearchQueryDto } from './dto/job-search-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  search(@Query() query: JobSearchQueryDto) {
    return this.jobsService.search(query);
  }

  @Get('cities')
  cities() {
    return this.jobsService.listCities();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.jobsService.getOne(id);
  }
}
