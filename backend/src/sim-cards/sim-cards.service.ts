import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { SimEligibilityDto } from './dto/sim-eligibility.dto';
import { CreateSimCardDto } from './dto/create-sim-card.dto';
import { UpdateSimCardDto } from './dto/update-sim-card.dto';
import { SimCardResponseDto } from './dto/sim-card-response.dto';
import { QuerySimCardDto } from './dto/query-sim-card.dto';

@Injectable()
export class SimCardsService {
  private readonly logger = new Logger(SimCardsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSimCardDto, userId: string): Promise<SimCardResponseDto> {
    const sim = await this.prisma.sIMCard.create({
      data: {
        iccid: dto.iccid,
        msisdn: dto.msisdn,
        provider: dto.provider,
        ipAddress: dto.ipAddress,
        ipType: dto.ipType,
        status: 'available',
        createdBy: userId,
        updatedBy: userId
      }
    });
    return this.toResponse(sim);
  }

  async findAll(query?: QuerySimCardDto): Promise<SimCardResponseDto[]> {
    const where: Record<string, unknown> = {};
    if (query?.status) where.status = query.status;
    if (query?.provider) where.provider = { contains: query.provider, mode: 'insensitive' };
    if (query?.search) {
      where.OR = [
        { iccid: { contains: query.search, mode: 'insensitive' } },
        { msisdn: { contains: query.search, mode: 'insensitive' } }
      ];
    }
    const sims = await this.prisma.sIMCard.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    return sims.map((s) => this.toResponse(s));
  }

  async findOne(id: string): Promise<SimCardResponseDto> {
    const sim = await this.prisma.sIMCard.findUnique({ where: { id } });
    if (!sim) {
      throw new NotFoundException(`SIM card ${id} not found`);
    }
    return this.toResponse(sim);
  }

  async update(id: string, dto: UpdateSimCardDto, userId: string): Promise<SimCardResponseDto> {
    await this.findOne(id);
    const sim = await this.prisma.sIMCard.update({
      where: { id },
      data: {
        iccid: dto.iccid,
        msisdn: dto.msisdn,
        provider: dto.provider,
        ipAddress: dto.ipAddress,
        ipType: dto.ipType,
        status: dto.status,
        cooldownUntil:
          dto.cooldownUntil !== undefined
            ? dto.cooldownUntil
              ? new Date(dto.cooldownUntil)
              : null
            : undefined,
        updatedBy: userId
      }
    });
    return this.toResponse(sim);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.sIMCard.update({
      where: { id },
      data: { status: 'retired', updatedBy: userId }
    });
  }

  async getEligibility(simId: string): Promise<SimEligibilityDto> {
    const sim = await this.prisma.sIMCard.findUnique({ where: { id: simId } });
    if (!sim) {
      throw new NotFoundException(`SIM card ${simId} not found`);
    }

    const activeAssignment = await this.prisma.sIMAssignment.findFirst({
      where: { simId, status: 'active' }
    });

    if (activeAssignment) {
      return {
        simId,
        eligible: false,
        reason: 'SIM is currently assigned to an active meter',
        cooldownUntil: null
      };
    }

    if (sim.cooldownUntil && sim.cooldownUntil > new Date()) {
      return {
        simId,
        eligible: false,
        reason: 'SIM is in cooldown period',
        cooldownUntil: sim.cooldownUntil.toISOString()
      };
    }

    if (sim.cooldownUntil && sim.cooldownUntil <= new Date()) {
      return {
        simId,
        eligible: true,
        reason: 'Cooldown period expired',
        cooldownUntil: null
      };
    }

    return {
      simId,
      eligible: true,
      reason: 'SIM is available',
      cooldownUntil: null
    };
  }

  private toResponse(sim: {
    id: string;
    iccid: string;
    msisdn: string;
    provider: string;
    ipAddress: string;
    ipType: string;
    status: string;
    cooldownUntil: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): SimCardResponseDto {
    return {
      id: sim.id,
      iccid: sim.iccid,
      msisdn: sim.msisdn,
      provider: sim.provider,
      ipAddress: sim.ipAddress,
      ipType: sim.ipType,
      status: sim.status,
      cooldownUntil: sim.cooldownUntil,
      createdAt: sim.createdAt,
      updatedAt: sim.updatedAt
    };
  }
}
