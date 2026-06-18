import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Query
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/types/role.enum';
import { Audit } from '../audit/audit.decorator';
import { ApiOperation } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { PrismaService } from '../common/database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('projects/:projectId/customers')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post()
  @Roles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Audit('customer', 'create')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateCustomerDto,
    @Req() req: { user: { userId: string } }
  ) {
    const customer = await this.customersService.create(projectId, dto, req.user.userId);
    this.notificationsService.create({ userId: req.user.userId, title: `Customer created: ${customer.name}`, type: 'customer', referenceType: 'customer', referenceId: customer.id }).catch(() => {});
    return customer;
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
  async findAll(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.customersService.findAll(projectId);
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
  async findOne(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.customersService.findOne(projectId, id);
  }

  @Patch(':id')
  @Roles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN)
  @Audit('customer', 'update')
  async update(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
    @Req() req: { user: { userId: string } }
  ) {
    return this.customersService.update(projectId, id, dto, req.user.userId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Audit('customer', 'deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: { user: { userId: string } }
  ) {
    await this.customersService.remove(projectId, id, req.user.userId);
  }

  @Get(':id/statement')
  @Roles(Role.OPERATOR, Role.ADMIN, Role.SUPER_ADMIN, Role.FINANCE, Role.SUPPORT, Role.CUSTOMER)
  @ApiOperation({ summary: 'Get customer statement with debit/credit/running balance' })
  async getStatement(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    await this.customersService.findOne(projectId, id);
    const entries: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM sim_system.customer_statement_view
       WHERE customer_id = $1
       AND ($2::timestamp IS NULL OR entry_date >= $2)
       AND ($3::timestamp IS NULL OR entry_date <= $3)
       ORDER BY entry_date, ledger_entry_id`,
      id,
      from ? new Date(from) : null,
      to ? new Date(to) : null
    );
    const debitSum = entries.reduce((s, e) => s + Number(e.debit), 0);
    const creditSum = entries.reduce((s, e) => s + Number(e.credit), 0);
    const lastBalance = entries.length > 0 ? Number(entries[entries.length - 1].running_balance) : 0;
    return {
      customerId: id,
      projectId,
      entries: entries.map((e) => ({
        id: e.ledger_entry_id,
        entryDate: e.entry_date,
        referenceType: e.reference_type,
        referenceId: e.reference_id,
        debit: Number(e.debit),
        credit: Number(e.credit),
        runningBalance: Number(e.running_balance)
      })),
      summary: {
        totalEntries: entries.length,
        totalDebit: debitSum,
        totalCredit: creditSum,
        currentBalance: lastBalance
      }
    };
  }
}
