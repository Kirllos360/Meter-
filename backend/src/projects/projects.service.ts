import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProjectDto, userId: string): Promise<ProjectResponseDto> {
    const project = await this.prisma.project.create({
      data: {
        code: dto.code,
        name: dto.name,
        taxEnabled: dto.taxEnabled ?? false,
        taxRate: dto.taxRate ?? undefined,
        readingThresholdProfileId: dto.readingThresholdProfileId ?? undefined,
        waterDifferenceMode: dto.waterDifferenceMode ?? 'report_only',
        createdBy: userId,
        updatedBy: userId
      }
    });
    return this.toResponse(project);
  }

  async findAll(areaId?: string): Promise<ProjectResponseDto[]> {
    const where: any = {};
    if (areaId) where.areaId = areaId;
    const projects = await this.prisma.project.findMany({ where, orderBy: { createdAt: 'desc' } });
    return projects.map(this.toResponse);
  }

  async findOne(id: string): Promise<ProjectResponseDto> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project ${id} not found`);
    }
    return this.toResponse(project);
  }

  async update(id: string, dto: UpdateProjectDto, userId: string): Promise<ProjectResponseDto> {
    await this.findOne(id);
    const project = await this.prisma.project.update({
      where: { id },
      data: {
        code: dto.code,
        name: dto.name,
        taxEnabled: dto.taxEnabled,
        taxRate: dto.taxRate,
        readingThresholdProfileId: dto.readingThresholdProfileId,
        waterDifferenceMode: dto.waterDifferenceMode,
        status: dto.status,
        updatedBy: userId
      }
    });
    return this.toResponse(project);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.project.update({
      where: { id },
      data: { status: 'inactive', updatedBy: userId }
    });
  }

  private toResponse(project: {
    id: string;
    code: string;
    name: string;
    status: string;
    taxEnabled: boolean;
    taxRate?: any;
    readingThresholdProfileId?: string | null;
    waterDifferenceMode: string;
    createdAt: Date;
    updatedAt: Date;
  }): ProjectResponseDto {
    return {
      id: project.id,
      code: project.code,
      name: project.name,
      status: project.status,
      taxEnabled: project.taxEnabled,
      taxRate: project.taxRate ? Number(project.taxRate) : null,
      readingThresholdProfileId: project.readingThresholdProfileId ?? null,
      waterDifferenceMode: project.waterDifferenceMode,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };
  }
}
