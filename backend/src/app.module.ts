import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppConfigModule } from './common/config/config.module';
import { DatabaseModule } from './common/database/database.module';
import { AuthModule } from './auth/auth.module';
import { GlobalAuthGuard } from './auth/global-auth.guard';
import { AreaGuard } from './auth/area.guard';
import { AuditModule } from './audit/audit.module';
import { AuditInterceptor } from './audit/audit.interceptor';
import { IdempotencyModule } from './idempotency/idempotency.module';
import { MetersModule } from './meters/meters.module';
import { SimCardsModule } from './sim-cards/sim-cards.module';
import { ProjectsModule } from './projects/projects.module';
import { LocationsModule } from './projects/locations/locations.module';
import { CustomersModule } from './customers/customers.module';
import { DashboardModule } from './projects/dashboard/dashboard.module';
import { ReadingsModule } from './readings/readings.module';
import { WaterBalanceModule } from './readings/water-balance/water-balance.module';
import { BillingModule } from './billing/billing.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DownloadsModule } from './downloads/downloads.module';
import { CorrelationMiddleware } from './common/http/correlation.middleware';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AppConfigModule,
    DatabaseModule,
    AuthModule,
    AuditModule,
    IdempotencyModule,
    MetersModule,
    SimCardsModule,
    ProjectsModule,
    LocationsModule,
    CustomersModule,
    DashboardModule,
    ReadingsModule,
    WaterBalanceModule,
    BillingModule,
    PaymentsModule,
    NotificationsModule,
    DownloadsModule
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    {
      provide: APP_GUARD,
      useClass: GlobalAuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: AreaGuard
    }
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationMiddleware).forRoutes('*');
  }
}
