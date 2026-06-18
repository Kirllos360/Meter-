import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/types/role.enum';
import { Audit } from '../audit/audit.decorator';
import { MetersService } from './meters.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AssignMeterDto } from './dto/assign-meter.dto';
import { TerminateMeterDto } from './dto/terminate-meter.dto';
import { CreateMeterDto } from './dto/create-meter.dto';
import { UpdateMeterDto } from './dto/update-meter.dto';
import { QueryMeterDto } from './dto/query-meter.dto';

@Controller('meters')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class MetersController {
  constructor(
    private readonly metersService: MetersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post()
  @Roles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Audit('meter', 'create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateMeterDto, @Req() req: { user: { userId: string } }) {
    return this.metersService.create(dto, req.user.userId);
  }

  @Get()
  @Roles(
    Role.OPERATOR,
    Role.ADMIN,
    Role.SUPER_ADMIN,
    Role.TECHNICIAN,
    Role.FINANCE,
    Role.SUPPORT
  )
  async findAll(@Query() query: QueryMeterDto) {
    return this.metersService.findAll(query);
  }

  @Get(':id')
  @Roles(
    Role.OPERATOR,
    Role.ADMIN,
    Role.SUPER_ADMIN,
    Role.TECHNICIAN,
    Role.FINANCE,
    Role.SUPPORT
  )
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.metersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Audit('meter', 'update')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMeterDto,
    @Req() req: { user: { userId: string } }
  ) {
    return this.metersService.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @Audit('meter', 'deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: { user: { userId: string } }) {
    await this.metersService.remove(id, req.user.userId);
  }

  @Post(':meterId/assign')
  @Roles(Role.OPERATOR, Role.ADMIN)
  @Audit('meter_assignment', 'assign')
  @HttpCode(HttpStatus.OK)
  async assignMeter(
    @Param('meterId', ParseUUIDPipe) meterId: string,
    @Body() dto: AssignMeterDto,
    @Req() req: { user: { userId: string } }
  ) {
    const result = await this.metersService.assignMeter(meterId, dto, req.user.userId);
    this.notificationsService.create({ userId: req.user.userId, title: `Meter assigned: ${meterId.substring(0,8)}`, type: 'meter', referenceType: 'assignment', referenceId: meterId }).catch(() => {});
    return result;
  }

  @Post(':meterId/terminate')
  @Roles(Role.OPERATOR, Role.ADMIN)
  @Audit('meter_assignment', 'terminate')
  @HttpCode(HttpStatus.OK)
  async terminateMeter(
    @Param('meterId', ParseUUIDPipe) meterId: string,
    @Body() dto: TerminateMeterDto,
    @Req() req: { user: { userId: string } }
  ) {
    return this.metersService.terminateMeter(meterId, dto, req.user.userId);
  }
}
