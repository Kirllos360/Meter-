import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/types/role.enum';
import { Audit } from '../audit/audit.decorator';
import { ReadingsService } from './readings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateReadingDto } from './dto/create-reading.dto';

@Controller('readings')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ReadingsController {
  constructor(
    private readonly readingsService: ReadingsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post()
  @Roles(Role.OPERATOR, Role.TECHNICIAN, Role.ADMIN, Role.SUPER_ADMIN)
  @Audit('reading', 'create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateReadingDto, @Req() req: { user: { userId: string } }) {
    const reading = await this.readingsService.createReading(dto, req.user.userId);
    this.notificationsService.create({ userId: req.user.userId, title: `Reading submitted: ${reading.meterSerial}`, body: `${reading.consumption} units`, type: 'reading', referenceType: 'reading', referenceId: reading.id }).catch(() => {});
    return reading;
  }

  @Get()
  @Roles(Role.OPERATOR, Role.TECHNICIAN, Role.ADMIN, Role.SUPER_ADMIN, Role.FINANCE, Role.SUPPORT)
  @HttpCode(HttpStatus.OK)
  async findAll(@Query('projectId') projectId?: string) {
    return this.readingsService.findAll(projectId);
  }

  @Get('review-queue')
  @Roles(Role.OPERATOR, Role.TECHNICIAN, Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async listReviewQueue(@Query('projectId') projectId?: string, @Query('status') status?: string) {
    return this.readingsService.listReviewQueue({ projectId, status });
  }

  @Get(':id')
  @Roles(Role.OPERATOR, Role.TECHNICIAN, Role.ADMIN, Role.SUPER_ADMIN, Role.FINANCE, Role.SUPPORT)
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.readingsService.findOne(id);
  }
}
