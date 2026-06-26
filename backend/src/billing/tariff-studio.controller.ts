import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards, Logger, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/types/role.enum';
import { PrismaService } from '../common/database/prisma.service';

@ApiTags('Tariff Studio')
@Controller('tariffs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TariffStudioController {
  private readonly logger = new Logger(TariffStudioController.name);
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN, Role.FINANCE)
  @ApiOperation({ summary: 'List tariffs by utility type' })
  async findAll(@Query('utility') utility?: string) {
    const where: any = {};
    if (utility) where.utilityType = utility;
    return this.prisma.tariff.findMany({
      where,
      include: {
        charges: {
          include: { details: { orderBy: { stepFrom: 'asc' } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id')
  @Roles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN, Role.FINANCE)
  @ApiOperation({ summary: 'Get tariff by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const tariff = await this.prisma.tariff.findUnique({
      where: { id },
      include: {
        charges: {
          include: { details: { orderBy: { stepFrom: 'asc' } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!tariff) throw new NotFoundException();
    return tariff;
  }

  @Post()
  @Roles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a tariff' })
  async create(
    @Body() dto: { tariffCode: string; tariffName: string; description?: string; utilityType: string },
    @Req() req: { user: { userId: string } }
  ) {
    return this.prisma.tariff.create({
      data: {
        tariffCode: dto.tariffCode,
        tariffName: dto.tariffName,
        description: dto.description,
        utilityType: dto.utilityType as any,
        isActive: true,
        effectiveFrom: new Date(),
        createdBy: req.user.userId,
        updatedBy: req.user.userId,
      },
    });
  }

  @Patch(':id')
  @Roles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a tariff' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { tariffCode?: string; tariffName?: string; description?: string; utilityType?: string; isActive?: boolean },
    @Req() req: { user: { userId: string } }
  ) {
    const data: any = { updatedBy: req.user.userId };
    if (dto.tariffCode !== undefined) data.tariffCode = dto.tariffCode;
    if (dto.tariffName !== undefined) data.tariffName = dto.tariffName;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.utilityType !== undefined) data.utilityType = dto.utilityType;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    return this.prisma.tariff.update({ where: { id }, data });
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a tariff' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const tariff = await this.prisma.tariff.findUnique({ where: { id } });
    if (!tariff) throw new NotFoundException();
    const charges = await this.prisma.tariffCharge.findMany({ where: { tariffId: id } });
    for (const c of charges) {
      await this.prisma.tariffChargeDetail.deleteMany({ where: { chargeId: c.id } });
    }
    await this.prisma.tariffCharge.deleteMany({ where: { tariffId: id } });
    await this.prisma.tariff.delete({ where: { id } });
    return { status: 'deleted' };
  }

  @Post(':id/tiers')
  @Roles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save tier details for a tariff' })
  async saveTiers(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { tiers: Array<{ stepFrom: number; stepTo: number; stepRate: number; chargeGroup?: number }> },
    @Req() req: { user: { userId: string } }
  ) {
    const tariff = await this.prisma.tariff.findUnique({ where: { id } });
    if (!tariff) throw new NotFoundException();
    const userId = req.user.userId;
    let charge = await this.prisma.tariffCharge.findFirst({ where: { tariffId: id, chargeMode: 'STEPS' } });
    if (!charge) {
      charge = await this.prisma.tariffCharge.create({
        data: {
          tariffId: id,
          chargeCode: 'TIERS',
          chargeName: 'Consumption Tiers',
          chargeMode: 'STEPS',
          settlementType: 'FIXED',
          sortOrder: 0,
          isActive: true,
          createdBy: userId,
          updatedBy: userId,
        },
      });
    }
    await this.prisma.tariffChargeDetail.deleteMany({ where: { chargeId: charge.id } });
    for (const tier of dto.tiers) {
      await this.prisma.tariffChargeDetail.create({
        data: {
          chargeId: charge.id,
          stepFrom: tier.stepFrom,
          stepTo: tier.stepTo,
          stepRate: tier.stepRate,
        },
      });
    }
    return { status: 'saved', chargeId: charge.id };
  }
}
