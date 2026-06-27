import { Module } from '@nestjs/common';
import { DatabaseModule } from '../common/database/database.module';
import { AuditService } from './audit.service';
import { SecurityAuditService } from './security-audit.service';
import { AuditInterceptor } from './audit.interceptor';

@Module({
  imports: [DatabaseModule],
  providers: [AuditService, SecurityAuditService, AuditInterceptor],
  exports: [AuditService, SecurityAuditService, AuditInterceptor]
})
export class AuditModule {}
